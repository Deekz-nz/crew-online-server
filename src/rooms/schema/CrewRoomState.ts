import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Card, GameStage, Player, Trick } from "./CrewTypes";

// === Define Room State ===
export class CrewGameState extends Schema {
  @type("string") gameHost!: string;
  @type("boolean") gameStarted: boolean = false;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
  @type("string") currentPlayer: string = "";
  
  @type(Trick) currentTrick: Trick;
  @type([Trick]) completedTricks = new ArraySchema<Trick>();

  @type("string") currentGameStage: GameStage;
}
