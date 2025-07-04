import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

// === Enums and Types ===
export enum CardColor {
  Yellow = "yellow",
  Green = "green",
  Pink = "pink",
  Blue = "blue",
  Black = "black",
}

export enum GameStage {
  NotStarted = "not_started",
  GameSetup = "game_setup",
  TrickStart = "trick_start",
  TrickMiddle = "trick_middle",
  TrickEnd = "trick_end",
  GameEnd = "game_end"
}

export enum CommunicationRank {
  Highest = "highest",
  Lowest = "lowest",
  Only = "only",
  Unknown = "unknown"
}

export type TaskCategory = "ordered" | "plain" | "sequence" | "must_be_last";

// === Define Card ===
export class Card extends Schema {
  @type("string") color!: CardColor; // "yellow" | "green" | "pink" | "blue"
  @type("number") number!: number; // 1 - 9
}

export class BaseTask extends Schema {
  @type("string") taskId: string;
  @type("string") player: string;
  @type("boolean") failed: boolean = false;
  @type("boolean") completed: boolean = false;

  // Optional metadata for tracking when this task was completed
  @type("number") completedAtTrickIndex?: number;
}

export class SimpleTask extends BaseTask {
  @type(Card) card: Card;
  @type("number") taskNumber: number;

  @type("string") taskCategory: TaskCategory;

  // Only used for ordered/sequence tasks
  @type("number") sequenceIndex: number; // 0-based index in order
}


export class ExpansionTask extends BaseTask {
  @type("string") displayName: string;
  @type("string") description: string;
  @type("string") evaluationDescription: string;
  @type("number") difficulty: number;
  @type(["string"]) interestedPlayers = new ArraySchema<string>();
}

// === Define Player ===
export class Player extends Schema {
  @type("string") sessionId!: string;
  @type([Card]) hand = new ArraySchema<Card>();
  @type("string") displayName: string;

  @type("boolean") hasCommunicated: boolean = false;
  @type(Card) communicationCard: Card;
  @type("string") communicationRank: CommunicationRank;
  @type("boolean") intendsToCommunicate: boolean = false;

  @type("boolean") isHost: boolean = false;
  @type("boolean") isConnected: boolean = true;
}

// === Define Trick ===
export class Trick extends Schema {
  @type([Card]) playedCards = new ArraySchema<Card>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
  // Track whether each played card was originally communicated
  @type(["boolean"]) communicationFlags = new ArraySchema<boolean>();
  @type("string") trickWinner: string;
  @type("boolean") trickCompleted: boolean;
}

// === Define PostGameStats ===
export class PlayerHistory extends Schema {
  @type([Card]) cards = new ArraySchema<Card>();
  @type([BaseTask]) tasks = new ArraySchema<BaseTask>();
}