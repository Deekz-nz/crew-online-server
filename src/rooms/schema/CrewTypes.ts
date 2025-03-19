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

// === Define Card ===
export class Card extends Schema {
  @type("string") color!: CardColor; // "yellow" | "green" | "pink" | "blue"
  @type("number") number!: number; // 1 - 9
}

// === Define Task ===
export class SimpleTask extends Schema {
  @type(Card) card: Card;
  @type("string") player: string;
  @type("number") taskNumber: number;
  @type("number") sequence: number;
  @type("boolean") mustBeLast: boolean;
}

// === Define Player ===
export class Player extends Schema {
  @type("string") sessionId!: string;
  @type([Card]) hand = new ArraySchema<Card>();
  @type("string") displayName: string;

  @type("boolean") hasCommunicated: boolean = false;
  @type(Card) communicationCard: Card;
  @type("string") communicationRank: CommunicationRank;

  @type([SimpleTask]) hasTasks = new ArraySchema<SimpleTask>();
}

// === Define Trick ===
export class Trick extends Schema {
  @type([Card]) playedCards = new ArraySchema<Card>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
  @type("string") trickWinner: string;
  @type("boolean") trickCompleted: boolean;
}
