import { CardColor } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";
import {
  getExpectedTrickCount,
  getNumPlayers,
  getPlayerCard,
  evaluateCollectCards,
  evaluateExactConsecutiveWins,
  hasConsecutiveWins,
} from "./taskHelpers";

export const miscTasks: ExpansionTaskDefinition[] = [
  {
    id: "only_black1",
    displayName: "Only the 1 Submarine",
    description: "the 1 submarine and NO OTHER submarine",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has won the BLACK 1 but NO OTHER BLACK CARDS in any of the tricks that they won",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      let hasBlack1 = false;
      for (const trick of tricks) {
        for (let i = 0; i < trick.playedCards.length; i++) {
          const card = trick.playedCards[i];
          const won = trick.trickWinner === playerId;
          if (card.color !== CardColor.Black) continue;
          if (card.number === 1) {
            if (won) {
              hasBlack1 = true;
            } else {
              return TaskState.FAILED;
            }
          } else if (won) {
            return TaskState.FAILED;
          }
        }
      }
      if (tricks.length === expected) {
        return hasBlack1 ? TaskState.COMPLETED : TaskState.FAILED;
      }
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "win_even_trick",
    displayName: "Even Number Trick",
    description: "a trick that contains ONLY EVEN-numbered cards",
    difficultyFor3: 2,
    difficultyFor4: 5,
    difficultyFor5: 6,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has won a trick where all the cards played were EVEN",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      let succeeded = false;
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        if (trick.playedCards.every(c => c.number % 2 === 0)) {
          succeeded = true;
        }
      }
      if (tricks.length === expected) {
        return succeeded ? TaskState.COMPLETED : TaskState.FAILED;
      }
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "win_odd_trick",
    displayName: "Odd Number Trick",
    description: "a trick that contains ONLY ODD-numbered cards",
    difficultyFor3: 2,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has won a trick where all the cards played were ODD",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      let succeeded = false;
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        if (trick.playedCards.every(c => c.number % 2 === 1)) {
          succeeded = true;
        }
      }
      if (tricks.length === expected) {
        return succeeded ? TaskState.COMPLETED : TaskState.FAILED;
      }
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "win_gt5_trick",
    displayName: "All Above Five",
    description: "a trick which the card values are ALL > 5",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick where the numbers of all the cards are bigger than 5",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        if (trick.playedCards.every(c => c.number > 5)) {
          return TaskState.COMPLETED;
        }
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "win_gt7_no_sub_trick",
    displayName: "No Sub & >7 Trick",
    description: "a trick of which the card values are ALL > 7",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won a trick with no black cards, where every number on the card was greater than 7",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        if (
          trick.playedCards.every(
            c => c.color !== CardColor.Black && c.number > 7
          )
        ) {
          return TaskState.COMPLETED;
        }
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "collect_all_threes",
    displayName: "All the 3s",
    description: "ALL the 3s",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won all the 3s (excluding BLACK) across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Yellow, number: 3 },
        { color: CardColor.Green, number: 3 },
        { color: CardColor.Pink, number: 3 },
        { color: CardColor.Blue, number: 3 },
      ]),
  },
  {
    id: "collect_all_nines",
    displayName: "All the 9s",
    description: "ALL the 9s",
    difficultyFor3: 4,
    difficultyFor4: 5,
    difficultyFor5: 6,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won all the 9s across the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Yellow, number: 9 },
        { color: CardColor.Green, number: 9 },
        { color: CardColor.Pink, number: 9 },
        { color: CardColor.Blue, number: 9 },
      ]),
  },
  {
    id: "never_two_in_row",
    displayName: "Never Two in a Row",
    description: "NEVER win TWO tricks in a ROW",
    difficultyFor3: 3,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player never won two tricks in a row",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (hasConsecutiveWins(tricks, playerId, 2)) return TaskState.FAILED;
      return tricks.length === expected ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "exact_two_in_row",
    displayName: "Exactly Two in a Row",
    description: "EXACTLY 2 tricks AND they will be in a row",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription:
      "Current planer won exactly two tricks in a row AND NO MORE TRICKS",
    evaluate: (tricks, playerId) =>
      evaluateExactConsecutiveWins(tricks, playerId, 2),
  },
  {
    id: "exact_three_in_row",
    displayName: "Exactly Three in a Row",
    description: "EXACTLY three tricks AND they will be in a row",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription:
      "Current planer won exactly three tricks in a row AND NO MORE TRICKS",
    evaluate: (tricks, playerId) =>
      evaluateExactConsecutiveWins(tricks, playerId, 3),
  },
  {
    id: "avoid_leading_pink_green",
    displayName: "Never Lead Pink or Green",
    description: "NOT open a trick with a pink OR a green card",
    difficultyFor3: 2,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player did not start ANY TRICK THIS GAME with a PINK or GREEN card",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      for (const trick of tricks) {
        if (trick.playerOrder[0] === playerId) {
          const card = getPlayerCard(trick, playerId);
          if (card && (card.color === CardColor.Pink || card.color === CardColor.Green)) {
            return TaskState.FAILED;
          }
        }
      }
      return tricks.length === expected ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "avoid_leading_pink_yellow_blue",
    displayName: "Never Lead Pink/Yellow/Blue",
    description: "NOT open a trick with a pink OR a yellow OR a blue card",
    difficultyFor3: 4,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player did not start ANY TRICK THIS GAME with a PINK, YELLOW or BLUE card",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      for (const trick of tricks) {
        if (trick.playerOrder[0] === playerId) {
          const card = getPlayerCard(trick, playerId);
          if (
            card &&
            (card.color === CardColor.Pink ||
              card.color === CardColor.Yellow ||
              card.color === CardColor.Blue)
          ) {
            return TaskState.FAILED;
          }
        }
      }
      return tricks.length === expected ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "sum_exact_values",
    displayName: "Exact Total Trick",
    description: "a trick with a TOTAL value of 21 or 22 or 23",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick where the SUM of the numbers of the cards is exactly 21 (in a three player game), 22 (in a four player game) or 23 (in a five player game)",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      const target = { 3: 21, 4: 22, 5: 23 }[numPlayers] || 23;
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        const sum = trick.playedCards.reduce((t, c) => t + c.number, 0);
        const hasSub = trick.playedCards.some(c => c.color === CardColor.Black);
        if (!hasSub && sum === target) return TaskState.COMPLETED;
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "sum_below_values",
    displayName: "Low Total Trick",
    description: "a trick with a TOTAL value < 8 / 12 / 16",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick where the SUM of the numbers of the cards is LESS THAN 8 (in a three player game), 12 (in a four player game) or 16 (in a five player game)",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      const limit = { 3: 8, 4: 12, 5: 16 }[numPlayers] || 16;
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        const sum = trick.playedCards.reduce((t, c) => t + c.number, 0);
        const hasSub = trick.playedCards.some(c => c.color === CardColor.Black);
        if (!hasSub && sum < limit) return TaskState.COMPLETED;
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "sum_above_values",
    displayName: "High Total Trick",
    description: "a trick with a TOTAL value > 23 / 28 / 31",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick where the SUM of the numbers of the cards is GREATER THAN 23 (in a three player game), 28 (in a four player game) or 31 (in a five player game)",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      const limit = { 3: 23, 4: 28, 5: 31 }[numPlayers] || 31;
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        const sum = trick.playedCards.reduce((t, c) => t + c.number, 0);
        const hasSub = trick.playedCards.some(c => c.color === CardColor.Black);
        if (!hasSub && sum > limit) return TaskState.COMPLETED;
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
];

