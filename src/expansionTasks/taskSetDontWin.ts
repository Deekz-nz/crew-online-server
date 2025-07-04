import { CardColor, type Trick, type Card } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";
import {
  getExpectedTrickCount,
  getNumPlayers,
  evaluateExactColorCount,
} from "./taskHelpers";

function evaluateNoCards(
  tricks: Trick[],
  playerId: string,
  predicate: (card: Card) => boolean
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);

  for (const trick of tricks) {
    if (trick.trickWinner !== playerId) continue;
    if (trick.playedCards.some(predicate)) return TaskState.FAILED;
  }

  return tricks.length === expected ? TaskState.COMPLETED : TaskState.IN_PROGRESS;
}


export const dontWinTasks: ExpansionTaskDefinition[] = [
  {
    id: "avoid_pink_and_blue",
    displayName: "No Pink or Blue",
    description: "no pink AND blue",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single PINK or BLUE in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.color === CardColor.Pink || c.color === CardColor.Blue),
  },
  {
    id: "limit_one_pink_one_green",
    displayName: "One Pink & One Green",
    description: "EXACTLY one pink AND one green",
    difficultyFor3: 4,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has only won a single PINK and single GREEN card across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, {
        [CardColor.Pink]: 1,
        [CardColor.Green]: 1,
      }),
  },
  {
    id: "avoid_yellow_and_green",
    displayName: "No Yellow or Green",
    description: "no yellow cards and no green cards",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single YELLOW or GREEN in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.color === CardColor.Yellow || c.color === CardColor.Green),
  },
  {
    id: "avoid_yellow",
    displayName: "No Yellow Cards",
    description: "no yellow cards",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single YELLOW in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.color === CardColor.Yellow),
  },
  {
    id: "avoid_pink",
    displayName: "No Pink Cards",
    description: "no pink",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single PINK in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.color === CardColor.Pink),
  },
  {
    id: "avoid_green",
    displayName: "No Green Cards",
    description: "no green",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single GREEN in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.color === CardColor.Green),
  },
  {
    id: "avoid_submarines",
    displayName: "No Submarines",
    description: "no submarines",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single a BLACK in any of the trick that they have won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.color === CardColor.Black),
  },
  {
    id: "avoid_fives",
    displayName: "No 5s",
    description: "NO 5s",
    difficultyFor3: 1,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player didn't win a trick that contained any color 5",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.number === 5),
  },
  {
    id: "avoid_ones",
    displayName: "No 1s",
    description: "no 1s",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single 1 in any of the tricks that they won (excluding BLACK)",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(
        tricks,
        playerId,
        c => c.number === 1 && c.color !== CardColor.Black
      ),
  },
  {
    id: "avoid_eights_and_nines",
    displayName: "No 8s or 9s",
    description: "no 8s AND no 9s",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 2,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single 8 or 9 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.number === 8 || c.number === 9),
  },
  {
    id: "avoid_nines",
    displayName: "No 9s",
    description: "no 9s",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single 9 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(tricks, playerId, c => c.number === 9),
  },
  {
    id: "avoid_one_two_three",
    displayName: "No 1s, 2s or 3s",
    description: "no 1s OR 2s OR 3s",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription:
      "Current player has not won a single 1, 2 or 3 in any of the tricks that they won (excluding BLACK)",
    evaluate: (tricks, playerId) =>
      evaluateNoCards(
        tricks,
        playerId,
        c => (c.number === 1 || c.number === 2 || c.number === 3) && c.color !== CardColor.Black
      ),
  },
];
