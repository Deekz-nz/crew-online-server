import { Schema, type } from "@colyseus/schema";

export class BasePlayer extends Schema {
  @type("string") sessionId!: string;
  @type("string") displayName: string;
  @type("boolean") isHost: boolean = false;
  @type("boolean") isConnected: boolean = true;
}

export class BaseRoomState extends Schema {
  @type("boolean") gameStarted: boolean = false;
  @type("string") roomCode: string = "";
  @type("string") gameType: string = "";
  @type("number") createdAt: number = Date.now();
}
