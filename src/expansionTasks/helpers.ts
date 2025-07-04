import { CardColor, type Trick } from "../rooms/schema/CrewTypes";
import { TaskState } from "./types";
import { getExpectedTrickCount, getNumPlayers } from "./taskHelpers";

export function evaluateExactColorCount(
  tricks: Trick[],
  playerId: string,
  colorCounts: Partial<Record<CardColor, number>>
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);
  const counts: Record<CardColor, number> = {
    [CardColor.Yellow]: 0,
    [CardColor.Green]: 0,
    [CardColor.Pink]: 0,
    [CardColor.Blue]: 0,
    [CardColor.Black]: 0,
  };

  for (const trick of tricks) {
    if (trick.trickWinner !== playerId) continue;
    for (const card of trick.playedCards) {
      counts[card.color] += 1;
      const limit = colorCounts[card.color];
      if (limit !== undefined && counts[card.color] > limit) {
        return TaskState.FAILED;
      }
    }
  }

  if (tricks.length === expected) {
    for (const [color, required] of Object.entries(colorCounts)) {
      if (counts[color as unknown as CardColor] !== required) {
        return TaskState.FAILED;
      }
    }
    return TaskState.COMPLETED;
  }

  return TaskState.IN_PROGRESS;
}

export function evaluateExactNumberCount(
  tricks: Trick[],
  playerId: string,
  numberCounts: Partial<Record<number, number>>
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);
  const counts: Record<number, number> = {};

  for (const trick of tricks) {
    if (trick.trickWinner !== playerId) continue;
    for (const card of trick.playedCards) {
      counts[card.number] = (counts[card.number] || 0) + 1;
      const limit = numberCounts[card.number];
      if (limit !== undefined && counts[card.number] > limit) {
        return TaskState.FAILED;
      }
    }
  }

  if (tricks.length === expected) {
    for (const [numStr, required] of Object.entries(numberCounts)) {
      const num = parseInt(numStr, 10);
      if ((counts[num] || 0) !== required) {
        return TaskState.FAILED;
      }
    }
    return TaskState.COMPLETED;
  }

  return TaskState.IN_PROGRESS;
}
