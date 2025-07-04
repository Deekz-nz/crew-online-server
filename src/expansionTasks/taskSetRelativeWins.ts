import { CardColor, Trick } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";
import { getExpectedTrickCount, getNumPlayers } from "./taskHelpers";

function tallyWonCards(tricks: Trick[], playerId: string) {
  const colorCounts: Record<CardColor, number> = {
    [CardColor.Yellow]: 0,
    [CardColor.Green]: 0,
    [CardColor.Pink]: 0,
    [CardColor.Blue]: 0,
    [CardColor.Black]: 0,
  };
  const numberCounts: Record<number, number> = {};
  const colorNumbers: Record<CardColor, Set<number>> = {
    [CardColor.Yellow]: new Set(),
    [CardColor.Green]: new Set(),
    [CardColor.Pink]: new Set(),
    [CardColor.Blue]: new Set(),
    [CardColor.Black]: new Set(),
  };

  for (const trick of tricks) {
    if (trick.trickWinner !== playerId) continue;
    for (const card of trick.playedCards) {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
      numberCounts[card.number] = (numberCounts[card.number] || 0) + 1;
      colorNumbers[card.color].add(card.number);
    }
  }

  return { colorCounts, numberCounts, colorNumbers };
}

function tallyPlayedCards(tricks: Trick[]) {
  const colorCounts: Record<CardColor, number> = {
    [CardColor.Yellow]: 0,
    [CardColor.Green]: 0,
    [CardColor.Pink]: 0,
    [CardColor.Blue]: 0,
    [CardColor.Black]: 0,
  };
  const numberCounts: Record<number, number> = {};
  const colorNumbers: Record<CardColor, Set<number>> = {
    [CardColor.Yellow]: new Set(),
    [CardColor.Green]: new Set(),
    [CardColor.Pink]: new Set(),
    [CardColor.Blue]: new Set(),
    [CardColor.Black]: new Set(),
  };

  for (const trick of tricks) {
    for (const card of trick.playedCards) {
      colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
      numberCounts[card.number] = (numberCounts[card.number] || 0) + 1;
      colorNumbers[card.color].add(card.number);
    }
  }

  return { colorCounts, numberCounts, colorNumbers };
}

export const relativeWinTasks: ExpansionTaskDefinition[] = [
  {
    id: "relative_one_each_color",
    displayName: "One of Each Colour",
    description: "AT LEAST one card of EACH COLOUR",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won at least one card of each colour across the tricks that they won",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const played = tallyPlayedCards(tricks);
      const required = [
        CardColor.Yellow,
        CardColor.Green,
        CardColor.Pink,
        CardColor.Blue,
      ];

      const completed = required.every(c => won.colorCounts[c] > 0);
      if (completed) return TaskState.COMPLETED;

      for (const color of required) {
        if (won.colorCounts[color] === 0 && played.colorCounts[color] === 9) {
          return TaskState.FAILED;
        }
      }

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_two_sevens",
    displayName: "Two 7s",
    description: "AT LEAST two 7s",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won at least two 7s across the tricks that they won",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const count = won.numberCounts[7] || 0;
      if (count >= 2) return TaskState.COMPLETED;

      const playedCount = tallyPlayedCards(tricks).numberCounts[7] || 0;
      const remaining = 4 - playedCount;
      if (count + remaining < 2) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_seven_yellow",
    displayName: "Seven Yellow Cards",
    description: "AT LEAST seven yellow",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won at least SEVEN YELLOW cards across all their tricks that they won",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const count = won.colorCounts[CardColor.Yellow];
      if (count >= 7) return TaskState.COMPLETED;

      const playedCount = tallyPlayedCards(tricks).colorCounts[CardColor.Yellow];
      const remaining = 9 - playedCount;
      if (count + remaining < 7) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_five_pink",
    displayName: "Five Pink Cards",
    description: "AT LEAST five pink",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won at least 5 PINK cards across all of their tricks",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const count = won.colorCounts[CardColor.Pink];
      if (count >= 5) return TaskState.COMPLETED;

      const playedCount = tallyPlayedCards(tricks).colorCounts[CardColor.Pink];
      const remaining = 9 - playedCount;
      if (count + remaining < 5) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_three_nines",
    displayName: "Three 9s",
    description: "AT LEAST three 9s",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player was won at least three of the 9s across all their tricks",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const count = won.numberCounts[9] || 0;
      if (count >= 3) return TaskState.COMPLETED;

      const playedCount = tallyPlayedCards(tricks).numberCounts[9] || 0;
      const remaining = 4 - playedCount;
      if (count + remaining < 3) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_three_fives",
    displayName: "Three 5s",
    description: "AT LEAST three 5s",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won at least three 5 cards across all of their tricks",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const count = won.numberCounts[5] || 0;
      if (count >= 3) return TaskState.COMPLETED;

      const playedCount = tallyPlayedCards(tricks).numberCounts[5] || 0;
      const remaining = 4 - playedCount;
      if (count + remaining < 3) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_complete_color",
    displayName: "Complete Set of a Colour",
    description: "all the cards in at least one of the four colours",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won every number (1-9) of any colour across all their tricks",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const played = tallyPlayedCards(tricks);
      const colors = [
        CardColor.Yellow,
        CardColor.Green,
        CardColor.Pink,
        CardColor.Blue,
      ];

      for (const color of colors) {
        if (won.colorNumbers[color].size === 9) return TaskState.COMPLETED;
      }

      let feasible = false;
      for (const color of colors) {
        let possible = true;
        for (let n = 1; n <= 9; n++) {
          if (!won.colorNumbers[color].has(n) && played.colorNumbers[color].has(n)) {
            possible = false;
            break;
          }
        }
        if (possible) {
          feasible = true;
          break;
        }
      }

      if (!feasible) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_more_pink_than_green",
    displayName: "More Pink Than Green",
    description: "MORE pink THAN green cards",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has won more PINK cards than GREEN cards across all the tricks that they won (they are allowed to win 0 green cards)",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const played = tallyPlayedCards(tricks);
      const pink = won.colorCounts[CardColor.Pink];
      const green = won.colorCounts[CardColor.Green];
      const remainingPink = 9 - played.colorCounts[CardColor.Pink];

      if (pink + remainingPink <= green) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length === expected) {
        return pink > green ? TaskState.COMPLETED : TaskState.FAILED;
      }
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_more_yellow_than_blue",
    displayName: "More Yellow Than Blue",
    description: "MORE yellow than blue",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has won more YELLOW cards than BLUE cards across all the tricks that they won (they are allowed to win 0 BLUE cards)",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const played = tallyPlayedCards(tricks);
      const yellow = won.colorCounts[CardColor.Yellow];
      const blue = won.colorCounts[CardColor.Blue];
      const remainingYellow = 9 - played.colorCounts[CardColor.Yellow];

      if (yellow + remainingYellow <= blue) return TaskState.FAILED;

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length === expected) {
        return yellow > blue ? TaskState.COMPLETED : TaskState.FAILED;
      }
      return TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_equal_pink_blue_trick",
    displayName: "Equal Pink & Blue Trick",
    description: "as MANY pink as blue cards in one trick",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick that contains the same number of PINK as BLUE cards in the trick (but must have at least one of each)",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        let pink = 0;
        let blue = 0;
        for (const card of trick.playedCards) {
          if (card.color === CardColor.Pink) pink++;
          if (card.color === CardColor.Blue) blue++;
        }
        if (pink > 0 && pink === blue) return TaskState.COMPLETED;
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_equal_green_yellow_trick",
    displayName: "Equal Green & Yellow Trick",
    description: "AS MANY green as yellow cards in one trick",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick that contains the same number of GREEN as YELLOW cards in the trick (but must have at least one of each)",
    evaluate: (tricks, playerId) => {
      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      for (const trick of tricks) {
        if (trick.trickWinner !== playerId) continue;
        let green = 0;
        let yellow = 0;
        for (const card of trick.playedCards) {
          if (card.color === CardColor.Green) green++;
          if (card.color === CardColor.Yellow) yellow++;
        }
        if (green > 0 && green === yellow) return TaskState.COMPLETED;
      }
      return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
    },
  },
  {
    id: "relative_equal_pink_yellow_total",
    displayName: "Equal Pink & Yellow",
    description: "as MANY pink as yellow cards",
    difficultyFor3: 4,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player won the same number of PINK and YELLOW cards all their tricks (they must win at least 1 of each)",
    evaluate: (tricks, playerId) => {
      const won = tallyWonCards(tricks, playerId);
      const played = tallyPlayedCards(tricks);
      const pink = won.colorCounts[CardColor.Pink];
      const yellow = won.colorCounts[CardColor.Yellow];
      const remainingPink = 9 - played.colorCounts[CardColor.Pink];
      const remainingYellow = 9 - played.colorCounts[CardColor.Yellow];

      if (Math.abs(pink - yellow) > Math.max(remainingPink, remainingYellow)) {
        return TaskState.FAILED;
      }

      const numPlayers = getNumPlayers(tricks);
      const expected = getExpectedTrickCount(numPlayers);
      if (tricks.length === expected) {
        return pink === yellow && pink > 0 ? TaskState.COMPLETED : TaskState.FAILED;
      }
      return TaskState.IN_PROGRESS;
    },
  },
];
