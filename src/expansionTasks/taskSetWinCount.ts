import { CardColor, Trick } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";

function getExpectedTrickCount(numPlayers: number): number {
  switch (numPlayers) {
    case 3:
      return 13;
    case 4:
      return 10;
    default:
      return 8;
  }
}

function getNumPlayers(tricks: Trick[]): number {
  if (tricks.length === 0) return 0;
  return tricks[0].playerOrder.length;
}

function countWins(tricks: Trick[], playerId: string): number {
  return tricks.filter(t => t.trickWinner === playerId).length;
}

function hasConsecutiveWins(
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

export const winCountTasks: ExpansionTaskDefinition[] = [
  {
    id: "count_zero_tricks",
    displayName: "Win No Tricks",
    description: "zero tricks",
    difficultyFor3: 4,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription: "Current player didn't win any tricks",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      const wins = countWins(tricks, playerId);

      if (wins > 0) return TaskState.FAILED;
      return tricks.length === expected ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_two_in_row",
    displayName: "Two Tricks in a Row",
    description: "two tricks in a row",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: true,
    evaluationDescription: "Current player won two tricks in a row",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      const completed = hasConsecutiveWins(tricks, playerId, 2);

      if (completed) return TaskState.COMPLETED;
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_three_in_row",
    displayName: "Three Tricks in a Row",
    description: "three tricks in a row",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription: "Current player has won three tricks in a row",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      const completed = hasConsecutiveWins(tricks, playerId, 3);

      if (completed) return TaskState.COMPLETED;
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_first_trick",
    displayName: "Win the First Trick",
    description: "the FIRST trick",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: true,
    evaluationDescription: "Current player won the first trick of the game",
    evaluate: (tricks, playerId) => {
      if (tricks.length === 0) return TaskState.IN_PROGRESS;
      const firstWinner = tricks[0].trickWinner;
      if (firstWinner === playerId) return TaskState.COMPLETED;
      return TaskState.FAILED;
    },
  },
  {
    id: "count_first_two_tricks",
    displayName: "Win First Two Tricks",
    description: "the FIRST two tricks",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 2,
    evaluateMidGame: true,
    evaluationDescription: "Current player won the first two tricks of the game",
    evaluate: (tricks, playerId) => {
      if (tricks.length === 0) return TaskState.IN_PROGRESS;
      if (tricks[0].trickWinner !== playerId) return TaskState.FAILED;
      if (tricks.length < 2) return TaskState.IN_PROGRESS;
      return tricks[1].trickWinner === playerId ? TaskState.COMPLETED : TaskState.FAILED;
    },
  },
  {
    id: "count_first_three_tricks",
    displayName: "Win First Three Tricks",
    description: "the FIRST 3 tricks",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription: "Current player won the first 3 tricks of the game",
    evaluate: (tricks, playerId) => {
      if (tricks.length === 0) return TaskState.IN_PROGRESS;
      if (tricks[0].trickWinner !== playerId) return TaskState.FAILED;
      if (tricks.length < 2) return TaskState.IN_PROGRESS;
      if (tricks[1].trickWinner !== playerId) return TaskState.FAILED;
      if (tricks.length < 3) return TaskState.IN_PROGRESS;
      return tricks[2].trickWinner === playerId ? TaskState.COMPLETED : TaskState.FAILED;
    },
  },
  {
    id: "count_only_first_trick",
    displayName: "Only the First Trick",
    description: "ONLY the FIRST trick",
    difficultyFor3: 4,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription: "Current player won the first trick and NO OTHER TRICKS",
    evaluate: (tricks, playerId) => {
      if (tricks.length === 0) return TaskState.IN_PROGRESS;
      if (tricks[0].trickWinner !== playerId) return TaskState.FAILED;
      const wins = countWins(tricks, playerId);
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (wins > 1) return TaskState.FAILED;
      return tricks.length === expected ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_only_last_trick",
    displayName: "Only the Last Trick",
    description: "ONLY the LAST trick",
    difficultyFor3: 4,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player only won a single trick and it was the LAST trick of the game",
    evaluate: (tricks, playerId) => {
      const wins = countWins(tricks, playerId);
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);

      if (wins > 1) return TaskState.FAILED;

      if (tricks.length === expected) {
        const lastTrick = tricks[tricks.length - 1];
        return wins === 1 && lastTrick.trickWinner === playerId
          ? TaskState.COMPLETED
          : TaskState.FAILED;
      }

      if (wins === 1) {
        // Won a trick before game end -> cannot be only last
        const lastTrickIndex = tricks.findIndex(t => t.trickWinner === playerId);
        if (lastTrickIndex < tricks.length - 1) return TaskState.FAILED;
      }

      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_last_trick",
    displayName: "Win the Last Trick",
    description: "the LAST trick",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription: "Current player won the last trick of the game",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length < expected) return TaskState.IN_PROGRESS;
      const lastTrick = tricks[expected - 1];
      return lastTrick.trickWinner === playerId ? TaskState.COMPLETED : TaskState.FAILED;
    },
  },
  {
    id: "count_first_and_last_trick",
    displayName: "Win First and Last Trick",
    description: "the FIRST and LAST trick",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription: "Current player won the first and the last trick of the game",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);

      if (tricks.length === 0) return TaskState.IN_PROGRESS;
      if (tricks[0].trickWinner !== playerId) return TaskState.FAILED;

      if (tricks.length < expected) return TaskState.IN_PROGRESS;
      const lastTrick = tricks[expected - 1];
      return lastTrick.trickWinner === playerId ? TaskState.COMPLETED : TaskState.FAILED;
    },
  },
  {
    id: "count_none_first_three",
    displayName: "None of First Three Tricks",
    description: "NONE of the first 3 tricks",
    difficultyFor3: 1,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: true,
    evaluationDescription: "Current player didn't win any of the first 3 tricks",
    evaluate: (tricks, playerId) => {
      const limit = 3;
      for (let i = 0; i < Math.min(limit, tricks.length); i++) {
        if (tricks[i].trickWinner === playerId) return TaskState.FAILED;
      }
      if (tricks.length >= limit) return TaskState.COMPLETED;
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_none_first_four",
    displayName: "None of First Four Tricks",
    description: "NONE of the first 4 tricks",
    difficultyFor3: 1,
    difficultyFor4: 2,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription: "Current player didn't win any of the first 4 tricks",
    evaluate: (tricks, playerId) => {
      const limit = 4;
      for (let i = 0; i < Math.min(limit, tricks.length); i++) {
        if (tricks[i].trickWinner === playerId) return TaskState.FAILED;
      }
      if (tricks.length >= limit) return TaskState.COMPLETED;
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_none_first_five",
    displayName: "None of First Five Tricks",
    description: "NONE of the first five tricks",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription: "Current player didn't win any of the first 5 tricks",
    evaluate: (tricks, playerId) => {
      const limit = 5;
      for (let i = 0; i < Math.min(limit, tricks.length); i++) {
        if (tricks[i].trickWinner === playerId) return TaskState.FAILED;
      }
      if (tricks.length >= limit) return TaskState.COMPLETED;
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_exactly_one",
    displayName: "Exactly One Trick",
    description: "EXACTLY one trick",
    difficultyFor3: 3,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription: "Current planer won exactly one trick",
    evaluate: (tricks, playerId) => {
      const wins = countWins(tricks, playerId);
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);

      if (wins > 1) return TaskState.FAILED;
      return tricks.length === expected ? (wins === 1 ? TaskState.COMPLETED : TaskState.FAILED) : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_exactly_four",
    displayName: "Exactly Four Tricks",
    description: "EXACTLY four tricks",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 5,
    evaluateMidGame: false,
    evaluationDescription: "Current planer won exactly four tricks",
    evaluate: (tricks, playerId) => {
      const wins = countWins(tricks, playerId);
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);

      if (wins > 4) return TaskState.FAILED;
      return tricks.length === expected ? (wins === 4 ? TaskState.COMPLETED : TaskState.FAILED) : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_exactly_two",
    displayName: "Exactly Two Tricks",
    description: "EXACTLY two tricks",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription: "Current planer won exactly two tricks",
    evaluate: (tricks, playerId) => {
      const wins = countWins(tricks, playerId);
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);

      if (wins > 2) return TaskState.FAILED;
      return tricks.length === expected ? (wins === 2 ? TaskState.COMPLETED : TaskState.FAILED) : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "count_more_than_anyone",
    displayName: "More Tricks Than Anyone",
    description: "MORE tricks than ANYONE else",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription: "Current player has won MORE tricks than any other player",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length < expected) return TaskState.IN_PROGRESS;

      const counts: Record<string, number> = {};
      for (const trick of tricks) {
        counts[trick.trickWinner] = (counts[trick.trickWinner] || 0) + 1;
      }

      const playerWins = counts[playerId] || 0;
      for (const [id, count] of Object.entries(counts)) {
        if (id !== playerId && playerWins <= count) return TaskState.FAILED;
      }
      return TaskState.COMPLETED;
    },
  },
  {
    id: "count_more_than_combined",
    displayName: "More Than Everyone Combined",
    description: "MORE tricks than everyone else combined",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has won more tricks than all other players combined",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length < expected) return TaskState.IN_PROGRESS;

      const playerWins = countWins(tricks, playerId);
      return playerWins > expected - playerWins
        ? TaskState.COMPLETED
        : TaskState.FAILED;
    },
  },
  {
    id: "count_fewer_than_anyone",
    displayName: "Fewer Tricks Than Anyone",
    description: "FEWER tricks than ANYONE else",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription: "Current player won less tricks than any other player",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length < expected) return TaskState.IN_PROGRESS;

      const counts: Record<string, number> = {};
      for (const trick of tricks) {
        counts[trick.trickWinner] = (counts[trick.trickWinner] || 0) + 1;
      }

      const playerWins = counts[playerId] || 0;
      for (const [id, count] of Object.entries(counts)) {
        if (id !== playerId && playerWins >= count) return TaskState.FAILED;
      }
      return TaskState.COMPLETED;
    },
  },
  {
    id: "count_green2_final_trick",
    displayName: "Green 2 in Final Trick",
    description: "the green 2 in the FINAL trick of the game",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won the last trick and it contained the GREEN 2",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);

      // If green 2 has been played earlier in the game, task is impossible
      for (let i = 0; i < tricks.length; i++) {
        const trick = tricks[i];
        const hasGreen2 = trick.playedCards.some(
          c => c.color === CardColor.Green && c.number === 2
        );
        if (hasGreen2 && i < expected - 1) return TaskState.FAILED;
      }

      if (tricks.length < expected) return TaskState.IN_PROGRESS;

      const lastTrick = tricks[expected - 1];
      const hasGreen2 = lastTrick.playedCards.some(
        c => c.color === CardColor.Green && c.number === 2
      );

      return hasGreen2 && lastTrick.trickWinner === playerId
        ? TaskState.COMPLETED
        : TaskState.FAILED;
    },
  },
];

