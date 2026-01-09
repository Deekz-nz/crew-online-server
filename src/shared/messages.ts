export const RoomMessage = {
  KICK_PLAYER: "kick_player",
  KICKED: "kicked",
  ROOM_CLOSED: "room_closed",
  SEND_EMOJI: "send_emoji",
  PLAYER_EMOJI: "player_emoji",
  RESTART_GAME: "restart_game",
} as const;

export type RoomMessageValue = (typeof RoomMessage)[keyof typeof RoomMessage];

export interface RoomClosedPayload {
  reason: "inactivity_timeout";
}

export type KickPlayerPayload = string;

export interface PlayerEmojiPayload {
  from: string;
  name: string;
  emoji: string;
  sentAt: number;
}
