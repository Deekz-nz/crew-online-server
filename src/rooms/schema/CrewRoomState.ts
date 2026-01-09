import { type, MapSchema, ArraySchema } from "@colyseus/schema";
import { BaseRoomState } from "./SharedSchemas";
import { BaseTask, Card, GameStage, Player, PlayerHistory, SimpleTask, Trick } from "./CrewTypes";

// === Define Room State ===
export class CrewGameState extends BaseRoomState {
  @type("string") gameHost!: string;

  @type("boolean") playExpansion: boolean = false;
  @type("number") expansionDifficulty: number = 0;

  @type({ map: Player }) players = new MapSchema<Player>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
  @type("string") currentPlayer: string = "";
  @type("string") commanderPlayer: string = "";
  
  @type(Trick) currentTrick: Trick;
  @type([Trick]) completedTricks = new ArraySchema<Trick>();
  @type("number") expectedTrickCount: number = 0;

  @type([BaseTask]) allTasks = new ArraySchema<BaseTask>();
  @type("number") completedTaskCount: number = 0;
  @type("number") completedSequenceTaskCount: number = 0;

  @type("boolean") gameFinished: boolean = false;
  @type("boolean") gameSucceeded: boolean = false;
  @type("string") currentGameStage: GameStage = GameStage.NotStarted;

  // Track if any undo was used during the game
  @type("boolean") undoUsed: boolean = false;

  @type({ map: PlayerHistory }) historyPlayerStats = new MapSchema<PlayerHistory>();
}
