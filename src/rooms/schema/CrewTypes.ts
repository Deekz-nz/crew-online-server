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

// === Define Card ===
export class Card extends Schema {
  @type("string") color!: CardColor; // "yellow" | "green" | "pink" | "blue"
  @type("number") number!: number; // 1 - 9
}

// === Define Player ===
export class Player extends Schema {
  @type("string") sessionId!: string;
  @type([Card]) hand = new ArraySchema<Card>();
  @type("string") displayName: string;
}

// === Define Trick ===
export class Trick extends Schema {
  @type([Card]) playedCards = new ArraySchema<Card>();
  @type(["string"]) playerOrder = new ArraySchema<string>();
  @type("string") trickWinner: string;
  @type("boolean") trickCompleted: boolean;
}