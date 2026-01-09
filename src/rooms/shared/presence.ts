import { Client, Room } from "colyseus";
import { RoomMessage } from "../../shared/messages";

export interface PresencePlayer {
  sessionId: string;
  displayName: string;
  isHost: boolean;
  isConnected: boolean;
  intendsToCommunicate?: boolean;
}

export interface PresenceState<PlayerType extends PresencePlayer> {
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

export interface PresenceConfig<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>> {
  createPlayer: () => PlayerType;
  canJoin?: (room: Room<StateType>, client: Client, options: any) => boolean;
  onPlayerCreated?: (player: PlayerType, room: Room<StateType>, client: Client, options: any) => void;
  onPlayerDisconnected?: (player: PlayerType, room: Room<StateType>) => void;
  onBeforeRemovePlayer?: (player: PlayerType, room: Room<StateType>) => void;
  canKick?: (room: Room<StateType>) => boolean;
  getDisplayName?: (room: Room<StateType>, sessionId: string) => string;
  inactivityTimeoutMs?: number;
  inactivityCheckIntervalMs?: number;
}

const lastActivityTimestamp = new WeakMap<Room, number>();
const inactivityIntervals = new WeakMap<Room, NodeJS.Timeout>();
const clientIpMaps = new WeakMap<Room, Map<string, string>>();

export function updateActivity(room: Room): void {
  lastActivityTimestamp.set(room, Date.now());
}

function getClientIpMap(room: Room): Map<string, string> {
  let map = clientIpMaps.get(room);
  if (!map) {
    map = new Map<string, string>();
    clientIpMaps.set(room, map);
  }
  return map;
}

function getDisplayName<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  config: PresenceConfig<PlayerType, StateType>,
  sessionId: string
): string {
  if (config.getDisplayName) {
    return config.getDisplayName(room, sessionId);
  }
  return room.state.players.get(sessionId)?.displayName ?? "Unknown";
}

export function installPresenceHandlers<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  config: PresenceConfig<PlayerType, StateType>
): void {
  startInactivityTimer(room, config);
  installKickHandler(room, config);
  installEmojiHandler(room, config);
}

export function handleAuth<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  client: Client,
  options: any,
  request: any
): boolean {
  const token = options.token;
  const expectedSecret = process.env.SHARED_SECRET;

  if (token !== expectedSecret) {
    throw new Error("Unauthorized");
  }

  const ip = (request.headers["x-forwarded-for"] || request.socket?.remoteAddress) as string | undefined;
  if (ip) {
    getClientIpMap(room).set(client.sessionId, ip);
  }

  return true;
}

export function handleJoin<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  client: Client,
  options: any,
  config: PresenceConfig<PlayerType, StateType>
): void {
  let player = room.state.players.get(client.sessionId);

  if (player) {
    const ip = getClientIpMap(room).get(client.sessionId);
    console.log(`Player ${player.displayName} reconnected from IP ${ip}`);
    player.isConnected = true;
    updateActivity(room);
    return;
  }

  const canJoin = config.canJoin ?? ((roomToCheck: Room<StateType>) => roomToCheck.state.gameStarted !== true);
  if (!canJoin(room, client, options)) {
    return;
  }

  updateActivity(room);
  player = config.createPlayer();
  player.sessionId = client.sessionId;

  const playerCount = room.state.players.size + 1;
  player.displayName = options.displayName || `Player ${playerCount}`;

  const ip = getClientIpMap(room).get(client.sessionId);
  console.log(`User (${player.displayName}) joined room ${room.roomId} from IP ${ip}`);

  if (room.state.players.size === 0) {
    player.isHost = true;
  }

  config.onPlayerCreated?.(player, room, client, options);
  room.state.players.set(client.sessionId, player);
  room.state.playerOrder.push(client.sessionId);
}

export function handleLeave<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  client: Client,
  consented: boolean,
  config: PresenceConfig<PlayerType, StateType>
): void {
  const player = room.state.players.get(client.sessionId);
  if (!player) return;

  const ip = getClientIpMap(room).get(client.sessionId);
  const reason = consented ? "client_left" : "connection_lost";
  console.log(
    `Player ${player.displayName} (session ${client.sessionId}, ip ${ip}) disconnected (${reason})`
  );

  const wasHost = player.isHost;
  config.onPlayerDisconnected?.(player, room);
  player.isConnected = false;

  if (consented) {
    removePlayer(room, client.sessionId, wasHost, config);
  } else {
    const RECONNECT_TIMEOUT = 300;
    room.allowReconnection(client, RECONNECT_TIMEOUT).then(() => {
      console.log(`Player ${player.displayName} (ip ${ip}) reconnected`);
      player.isConnected = true;
    }).catch(() => {
      console.log(`Player ${player.displayName} (ip ${ip}) failed to reconnect in time`);
      removePlayer(room, client.sessionId, wasHost, config);
    });
  }
}

export function handleDispose(room: Room): void {
  const inactivityInterval = inactivityIntervals.get(room);
  if (inactivityInterval) {
    clearInterval(inactivityInterval);
  }
  console.log("Room disposed, id: ", room.roomId);
}

function startInactivityTimer<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  config: PresenceConfig<PlayerType, StateType>
): void {
  const existingInterval = inactivityIntervals.get(room);
  if (existingInterval) {
    clearInterval(existingInterval);
  }

  const timeoutDuration = config.inactivityTimeoutMs ?? 10 * 60 * 1000;
  const checkInterval = config.inactivityCheckIntervalMs ?? 60 * 1000;

  const interval = setInterval(() => {
    const lastActivity = lastActivityTimestamp.get(room);
    if (!lastActivity) return;
    const now = Date.now();
    if (now - lastActivity > timeoutDuration) {
      console.log("Room inactive for 10 minutes. Disposing...");
      room.broadcast(RoomMessage.ROOM_CLOSED, { reason: "inactivity_timeout" });
      setTimeout(() => {
        room.disconnect();
      }, 1000);
    }
  }, checkInterval);

  inactivityIntervals.set(room, interval);
}

function installKickHandler<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  config: PresenceConfig<PlayerType, StateType>
): void {
  room.onMessage(RoomMessage.KICK_PLAYER, (client, targetSessionId: string) => {
    if (config.canKick && !config.canKick(room)) return;

    const requestingPlayer = room.state.players.get(client.sessionId);
    if (!requestingPlayer?.isHost) return;

    updateActivity(room);

    const targetClient = room.clients.find((c) => c.sessionId === targetSessionId);
    if (targetClient) {
      targetClient.send(RoomMessage.KICKED, {});
      targetClient.leave();

      const kickedPlayer = room.state.players.get(targetSessionId);
      if (kickedPlayer) {
        const wasHost = kickedPlayer.isHost;
        kickedPlayer.isConnected = false;
        removePlayer(room, targetSessionId, wasHost, config);
      }
    }
  });
}

function installEmojiHandler<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  config: PresenceConfig<PlayerType, StateType>
): void {
  room.onMessage(RoomMessage.SEND_EMOJI, (client, emoji: string) => {
    if (typeof emoji !== "string" || emoji.trim().length === 0) return;

    updateActivity(room);

    const payload = {
      from: client.sessionId,
      name: getDisplayName(room, config, client.sessionId),
      emoji,
      sentAt: Date.now(),
    };

    room.broadcast(RoomMessage.PLAYER_EMOJI, payload);
  });
}

function removePlayer<PlayerType extends PresencePlayer, StateType extends PresenceState<PlayerType>>(
  room: Room<StateType>,
  sessionId: string,
  wasHost: boolean,
  config: PresenceConfig<PlayerType, StateType>
): void {
  console.log(`Removing player ${sessionId} from room ${room.roomId}`);
  const player = room.state.players.get(sessionId);
  if (player) {
    config.onBeforeRemovePlayer?.(player, room);
  }

  room.state.players.delete(sessionId);
  getClientIpMap(room).delete(sessionId);

  const index = room.state.playerOrder.indexOf(sessionId);
  if (index !== -1) {
    room.state.playerOrder.splice(index, 1);
  }

  if (wasHost && room.state.players.size > 0) {
    const firstKey = room.state.players.keys().next().value;
    const newHost = firstKey ? room.state.players.get(firstKey) : undefined;
    if (newHost) {
      newHost.isHost = true;
      console.log(`New host is ${newHost.displayName}`);
    }
  }
}
