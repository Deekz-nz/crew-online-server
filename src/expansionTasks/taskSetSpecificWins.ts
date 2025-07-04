import { CardColor, type Trick } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";
import {
  getExpectedTrickCount,
  getNumPlayers,
  getPlayerCard,
} from "./taskHelpers";

function evaluateWinWithNumber(
  tricks: Trick[],
  playerId: string,
  num: number,
  excludeBlack: boolean = false
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);

  for (const trick of tricks) {
    const card = getPlayerCard(trick, playerId);
    if (!card) continue;
    if (
      trick.trickWinner === playerId &&
      card.number === num &&
      (!excludeBlack || card.color !== CardColor.Black)
    ) {
      return TaskState.COMPLETED;
    }
  }

  return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
}

function evaluateSubmarineWithCard(
  tricks: Trick[],
  playerId: string,
  target: { color: CardColor; number: number }
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);

  for (const trick of tricks) {
    const contains = trick.playedCards.some(
      c => c.color === target.color && c.number === target.number
    );
    if (!contains) continue;
    const playerCard = getPlayerCard(trick, playerId);
    if (
      playerCard &&
      playerCard.color === CardColor.Black &&
      trick.trickWinner === playerId
    ) {
      return TaskState.COMPLETED;
    }
    return TaskState.FAILED;
  }

  return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
}

function evaluatePlayerNumberAndTrickContains(
  tricks: Trick[],
  playerId: string,
  playerNum: number,
  containsNum: number,
  excludePlayerBlack: boolean = false,
  requireDistinct: boolean = false
): TaskState {
  const numPlayers = getNumPlayers(tricks);
  const expected = getExpectedTrickCount(numPlayers);

  for (const trick of tricks) {
    if (trick.trickWinner !== playerId) continue;
    const playerCard = getPlayerCard(trick, playerId);
    if (!playerCard) continue;
    if (
      playerCard.number === playerNum &&
      (!excludePlayerBlack || playerCard.color !== CardColor.Black)
    ) {
      const hasNumber = trick.playedCards.some((c, i) => {
        if (requireDistinct && i === trick.playerOrder.indexOf(playerId)) {
          return false;
        }
        return c.number === containsNum;
      });
      if (hasNumber) return TaskState.COMPLETED;
    }
  }

  return tricks.length === expected ? TaskState.FAILED : TaskState.IN_PROGRESS;
}

export const specificWinTasks: ExpansionTaskDefinition[] = [
  {
    id: "specific_win_with5",
    displayName: "Win Using a 5",
    description: "a trick using a 5",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won a trick and they played a 5 of any colour",
    evaluate: (tricks, playerId) => evaluateWinWithNumber(tricks, playerId, 5),
  },
  {
    id: "specific_win_with3",
    displayName: "Win Using a 3",
    description: "a trick using a 3",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick by winning with a 3 of any colour (excluding BLACK)",
    evaluate: (tricks, playerId) =>
      evaluateWinWithNumber(tricks, playerId, 3, true),
  },
  {
    id: "specific_win_with2",
    displayName: "Win Using a 2",
    description: "a trick USING a 2",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick by winning with a 2 of any colour (except BLACK)",
    evaluate: (tricks, playerId) =>
      evaluateWinWithNumber(tricks, playerId, 2, true),
  },
  {
    id: "specific_win_with6",
    displayName: "Win Using a 6",
    description: "a trick using a 6",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick by winning with a 6 of any colour",
    evaluate: (tricks, playerId) => evaluateWinWithNumber(tricks, playerId, 6),
  },
  {
    id: "specific_green9_with_submarine",
    displayName: "Green 9 with Submarine",
    description: "the green 9 with a submarine",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won the green 9 in a trick and they played a BLACK card",
    evaluate: (tricks, playerId) =>
      evaluateSubmarineWithCard(tricks, playerId, {
        color: CardColor.Green,
        number: 9,
      }),
  },
  {
    id: "specific_pink7_with_submarine",
    displayName: "Pink 7 with Submarine",
    description: "the pink 7 WITH A submarine",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player won a trick while playing a BLACK card and that trick contained the PINK 7",
    evaluate: (tricks, playerId) =>
      evaluateSubmarineWithCard(tricks, playerId, {
        color: CardColor.Pink,
        number: 7,
      }),
  },
  {
    id: "specific_5_with_7",
    displayName: "A 5 with a 7",
    description: "a 5 WITH a 7",
    difficultyFor3: 1,
    difficultyFor4: 2,
    difficultyFor5: 2,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick that contains a 5 and they played a 7",
    evaluate: (tricks, playerId) =>
      evaluatePlayerNumberAndTrickContains(tricks, playerId, 7, 5),
  },
  {
    id: "specific_two_sixes",
    displayName: "A 6 with Another 6",
    description: "a 6 with another 6",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick while playing a 6, and that trick contains a DIFFERENT 6",
    evaluate: (tricks, playerId) =>
      evaluatePlayerNumberAndTrickContains(
        tricks,
        playerId,
        6,
        6,
        false,
        true
      ),
  },
  {
    id: "specific_8_with_4",
    displayName: "An 8 with a 4",
    description: "an 8 with a 4",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 5,
    evaluateMidGame: true,
    evaluationDescription:
      "Current player has won a trick that contains a 8 and they played a 4 of any colour (excluding BLACK)",
    evaluate: (tricks, playerId) =>
      evaluatePlayerNumberAndTrickContains(
        tricks,
        playerId,
        4,
        8,
        true
      ),
  },
];
