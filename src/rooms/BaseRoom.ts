import { Client, Room } from "colyseus";
import { RoomMessage } from "../shared/messages";

/**
 * BaseRoom exists to centralize *presence* behavior that every game room needs:
 * joining, reconnecting, kicking, emoji chat, inactivity shutdown, and logging.
 *
 * Why this file exists:
 * - We used to keep this logic in a shared helper (presence.ts) that game rooms
 *   called manually. That made it easy to forget a step or split logic across
 *   files.
 * - BaseRoom makes the lifecycle authoritative: any game room that extends it
 *   automatically gets consistent presence behavior.
 *
 * What belongs here:
 * - Authentication, join/leave/reconnect flow, host assignment, kicking rules,
 *   inactivity shutdown, lightweight social messages, logging.
 *
 * What does *not* belong here:
 * - Game rules, gameplay state, or game-specific message handlers.
 *   (Those stay in the concrete room class.)
 *
 * How to use:
 * - Extend BaseRoom in your game room class.
 * - Implement createInitialState() for the game state schema.
 * - Optionally override configureRoom() to customize presence rules.
 * - Register game message handlers in registerGameMessages().
 *
 * BaseRoom is intentionally "boring glue." If something touches cards, tasks,
 * turns, or scoring, it shouldn't live here.
 */

export interface BaseRoomPlayer {
  sessionId: string;
  displayName: string;
  isHost: boolean;
  isConnected: boolean;
  intendsToCommunicate?: boolean;
}

export interface BaseRoomState<PlayerType extends BaseRoomPlayer = BaseRoomPlayer> {
  players: {
    size: number;
    get(key: string): PlayerType | undefined;
    set(key: string, value: PlayerType): void;
    delete(key: string): void;
    keys(): IterableIterator<string>;
  };
  playerOrder: {
    length: number;
    push(value: string): number;
    indexOf(value: string): number;
    splice(start: number, deleteCount?: number): string[];
  };
  gameStarted?: boolean;
  currentGameStage?: string;
}

export interface BaseRoomConfig<
  PlayerType extends BaseRoomPlayer,
  StateType extends BaseRoomState<PlayerType>,
> {
  /**
   * Provide a schema-backed player instance for the room.
   * This is the only required config entry.
   */
  createPlayer: () => PlayerType;
  /** Optional gate to prevent joining (e.g. after game start). */
  canJoin?: (room: Room<StateType>, client: Client, options: any) => boolean;
  /** Hook for setting additional player properties after creation. */
  onPlayerCreated?: (
    player: PlayerType,
    room: Room<StateType>,
    client: Client,
    options: any
  ) => void;
  /** Hook fired when a player disconnects (before reconnect logic). */
  onPlayerDisconnected?: (player: PlayerType, room: Room<StateType>) => void;
  /** Hook fired right before a player is removed from state. */
  onBeforeRemovePlayer?: (player: PlayerType, room: Room<StateType>) => void;
  /** Optional rule to control when kicking is allowed. */
  canKick?: (room: Room<StateType>) => boolean;
  /** Override how the display name is resolved for emoji messages. */
  getDisplayName?: (room: Room<StateType>, sessionId: string) => string;
  /** Inactivity cutoff (default: 10 minutes). */
  inactivityTimeoutMs?: number;
  /** Inactivity check interval (default: 60 seconds). */
  inactivityCheckIntervalMs?: number;
}


/**
 * BaseRoom implements the Colyseus lifecycle so game rooms do not need to.
 * It also installs standard messages that apply to every room.
 */
export abstract class BaseRoom<
  TPlayer extends BaseRoomPlayer,
  TState extends BaseRoomState<TPlayer>
> extends Room<TState> {
  private lastActivityTimestamp?: number;
  private inactivityInterval?: NodeJS.Timeout;
  private clientIpMap = new Map<string, string>();
  private roomConfig!: BaseRoomConfig<TPlayer, TState>;

  /**
   * Game rooms must provide their state instance here.
   * This keeps onCreate consistent across all games.
   */
  protected abstract createInitialState(): TState;

  /**
   * Game rooms register *only* game-specific messages here.
   * BaseRoom already handles kick/emoji messages.
   */
  protected abstract registerGameMessages(): void;

  /**
   * Optional override for presence rules. By default, only createPlayer is
   * required, while other rules fall back to sensible defaults.
   */
  protected configureRoom(): BaseRoomConfig<TPlayer, TState> {
    return {
      createPlayer: () => {
        throw new Error("configureRoom() must provide createPlayer()");
      },
    };
  }

  /**
   * Game logic can call this to keep the room alive.
   * BaseRoom also calls it automatically for join/leave/kick/emoji events.
   */
  protected updateActivity(): void {
    this.lastActivityTimestamp = Date.now();
  }

  // === Colyseus lifecycle ===

  onCreate(options: any): void {
    this.state = this.createInitialState();
    this.roomConfig = this.configureRoom();

    if (options?.roomCode) {
      this.roomId = options.roomCode;
    }

    console.log("Created room with id: ", this.roomId);

    this.installKickHandler();
    this.installEmojiHandler();
    this.startInactivityTimer();
    this.registerGameMessages();
  }

  onAuth(client: Client, options: any, request: any): boolean {
    const token = options?.token;
    const expectedSecret = process.env.SHARED_SECRET;

    if (token !== expectedSecret) {
      throw new Error("Unauthorized");
    }

    const ip = (request.headers["x-forwarded-for"] ||
      request.socket?.remoteAddress) as string | undefined;
    if (ip) {
      this.clientIpMap.set(client.sessionId, ip);
    }

    return true;
  }

  onJoin(client: Client, options: any): void {
    let player = this.state.players.get(client.sessionId);

    if (player) {
      const ip = this.clientIpMap.get(client.sessionId);
      console.log(`Player ${player.displayName} reconnected from IP ${ip}`);
      player.isConnected = true;
      this.updateActivity();
      return;
    }

    const canJoin =
      this.roomConfig.canJoin ??
      ((roomToCheck: Room<TState>) => roomToCheck.state.gameStarted !== true);
    if (!canJoin(this, client, options)) {
      return;
    }

    this.updateActivity();
    player = this.roomConfig.createPlayer();
    player.sessionId = client.sessionId;

    const playerCount = this.state.players.size + 1;
    player.displayName = options?.displayName || `Player ${playerCount}`;

    const ip = this.clientIpMap.get(client.sessionId);
    console.log(`User (${player.displayName}) joined room ${this.roomId} from IP ${ip}`);

    if (this.state.players.size === 0) {
      player.isHost = true;
    }

    this.roomConfig.onPlayerCreated?.(player, this, client, options);
    this.state.players.set(client.sessionId, player);
    this.state.playerOrder.push(client.sessionId);
  }

  onLeave(client: Client, consented: boolean): void {
    this.updateActivity();

    const player = this.state.players.get(client.sessionId);
    if (!player) return;

    const ip = this.clientIpMap.get(client.sessionId);
    const reason = consented ? "client_left" : "connection_lost";
    console.log(
      `Player ${player.displayName} (session ${client.sessionId}, ip ${ip}) disconnected (${reason})`
    );

    const wasHost = player.isHost;
    this.roomConfig.onPlayerDisconnected?.(player, this);
    player.isConnected = false;

    if (consented) {
      this.removePlayer(client.sessionId, wasHost);
      return;
    }

    const reconnectTimeoutSeconds = 300;
    this.allowReconnection(client, reconnectTimeoutSeconds)
      .then(() => {
        console.log(`Player ${player.displayName} (ip ${ip}) reconnected`);
        player.isConnected = true;
      })
      .catch(() => {
        console.log(`Player ${player.displayName} (ip ${ip}) failed to reconnect in time`);
        this.removePlayer(client.sessionId, wasHost);
      });
  }

  onDispose(): void {
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
    }
    console.log("Room disposed, id: ", this.roomId);
  }

  // === Internal helpers ===

  private startInactivityTimer(): void {
    if (this.inactivityInterval) {
      clearInterval(this.inactivityInterval);
    }

    const timeoutDuration = this.roomConfig.inactivityTimeoutMs ?? 10 * 60 * 1000;
    const checkInterval = this.roomConfig.inactivityCheckIntervalMs ?? 60 * 1000;

    this.inactivityInterval = setInterval(() => {
      if (!this.lastActivityTimestamp) return;
      const now = Date.now();
      if (now - this.lastActivityTimestamp > timeoutDuration) {
        console.log("Room inactive for 10 minutes. Disposing...");
        this.broadcast(RoomMessage.ROOM_CLOSED, { reason: "inactivity_timeout" });
        setTimeout(() => {
          this.disconnect();
        }, 1000);
      }
    }, checkInterval);
  }

  private installKickHandler(): void {
    this.onMessage(RoomMessage.KICK_PLAYER, (client, targetSessionId: string) => {
      if (this.roomConfig.canKick && !this.roomConfig.canKick(this)) return;

      const requestingPlayer = this.state.players.get(client.sessionId);
      if (!requestingPlayer?.isHost) return;

      this.updateActivity();

      const targetClient = this.clients.find((c) => c.sessionId === targetSessionId);
      if (targetClient) {
        const targetPlayer = this.state.players.get(targetSessionId);
        const targetIp = this.clientIpMap.get(targetSessionId);
        console.log(
          `Host ${requestingPlayer.displayName} kicked ${targetPlayer?.displayName} (session ${targetSessionId}, ip ${targetIp})`
        );

        targetClient.send(RoomMessage.KICKED, {});
        targetClient.leave();

        if (targetPlayer) {
          const wasHost = targetPlayer.isHost;
          targetPlayer.isConnected = false;
          this.removePlayer(targetSessionId, wasHost);
        }
      }
    });
  }

  private installEmojiHandler(): void {
    this.onMessage(RoomMessage.SEND_EMOJI, (client, emoji: string) => {
      if (typeof emoji !== "string" || emoji.trim().length === 0) return;

      this.updateActivity();

      const payload = {
        from: client.sessionId,
        name: this.getDisplayName(client.sessionId),
        emoji,
        sentAt: Date.now(),
      };

      this.broadcast(RoomMessage.PLAYER_EMOJI, payload);
    });
  }

  private getDisplayName(sessionId: string): string {
    if (this.roomConfig.getDisplayName) {
      return this.roomConfig.getDisplayName(this, sessionId);
    }
    return this.state.players.get(sessionId)?.displayName ?? "Unknown";
  }

  private removePlayer(sessionId: string, wasHost: boolean): void {
    console.log(`Removing player ${sessionId} from room ${this.roomId}`);
    const player = this.state.players.get(sessionId);
    if (player) {
      this.roomConfig.onBeforeRemovePlayer?.(player, this);
    }

    this.state.players.delete(sessionId);
    this.clientIpMap.delete(sessionId);

    const index = this.state.playerOrder.indexOf(sessionId);
    if (index !== -1) {
      this.state.playerOrder.splice(index, 1);
    }

    if (wasHost && this.state.players.size > 0) {
      const firstKey = this.state.players.keys().next().value;
      const newHost = firstKey ? this.state.players.get(firstKey) : undefined;
      if (newHost) {
        newHost.isHost = true;
        console.log(`New host is ${newHost.displayName}`);
      }
    }
  }
}
