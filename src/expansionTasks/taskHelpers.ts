import { CardColor, Trick, Card } from "../rooms/schema/CrewTypes";
import { TaskState } from "./types";

export function getExpectedTrickCount(numPlayers: number): number {
  switch (numPlayers) {
    case 3:
      return 13;
    case 4:
      return 10;
    default:
      return 8;
  }
}

export function getNumPlayers(tricks: Trick[]): number {
  if (tricks.length === 0) return 0;
  return tricks[0].playerOrder.length;
}

export function countWins(tricks: Trick[], playerId: string): number {
  return tricks.filter(t => t.trickWinner === playerId).length;
}

export function hasConsecutiveWins(
  tricks: Trick[],
  playerId: string,
  required: number
): boolean {
  let current = 0;
  for (const trick of tricks) {
    if (trick.trickWinner === playerId) {
      current += 1;
      if (current >= required) return true;
    } else {
      current = 0;
    }
  }
  return false;
}

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

export function getPlayerCard(trick: Trick, playerId: string): Card | undefined {
  const idx = trick.playerOrder.indexOf(playerId);
  return idx >= 0 ? trick.playedCards[idx] : undefined;
}

export function evaluateCollectCards(
  tricks: Trick[],
  playerId: string,
  cards: { color: CardColor; number: number }[]
): TaskState {
  const found: Record<string, boolean> = {};
  cards.forEach(c => {
    found[`${c.color}_${c.number}`] = false;
  });

  for (const trick of tricks) {
    for (const card of trick.playedCards) {
      for (const req of cards) {
        if (card.color === req.color && card.number === req.number) {
          if (trick.trickWinner === playerId) {
            found[`${req.color}_${req.number}`] = true;
          } else {
            return TaskState.FAILED;
          }
        }
      }
    }
  }

  const allFound = Object.values(found).every(v => v);
  return allFound ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
}

export function evaluateExactConsecutiveWins(
  tricks: Trick[],
  playerId: string,
  required: number
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);

  let wins = 0;
  let current = 0;
  let best = 0;
  for (const trick of tricks) {
    if (trick.trickWinner === playerId) {
      wins++;
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }

    if (wins > required) return TaskState.FAILED;
    if (wins === required && best < required) return TaskState.FAILED;
  }

  if (tricks.length === expected) {
    return wins === required && best === required
      ? TaskState.COMPLETED
      : TaskState.FAILED;
  }

  return TaskState.IN_PROGRESS;
}
