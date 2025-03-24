import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { Card, GameStage, Player, PostGameStats, SimpleTask, Trick } from "./CrewTypes";

// === Define Room State ===
export class CrewGameState extends Schema {
  @type("string") gameHost!: string;
  @type("boolean") gameStarted: boolean = false;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
  @type("string") currentPlayer: string = "";
  @type("string") commanderPlayer: string = "";
  
  @type(Trick) currentTrick: Trick;
  @type([Trick]) completedTricks = new ArraySchema<Trick>();
  @type("number") expectedTrickCount: number = 0;

  @type([SimpleTask]) allTasks = new ArraySchema<SimpleTask>();
  @type("number") completedTaskCount: number = 0;
  @type("number") completedSequenceTaskCount: number = 0;

  @type("boolean") gameFinished: boolean = false;
  @type("boolean") gameSucceeded: boolean = false;
  @type("string") currentGameStage: GameStage = GameStage.NotStarted;

  @type(PostGameStats) postGameStats = new PostGameStats();
}
