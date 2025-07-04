import { Trick } from "../rooms/schema/CrewTypes";

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
