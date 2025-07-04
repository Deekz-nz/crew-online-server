import { CardColor, Trick } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";

function evaluateCollectCards(
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

export const simpleTasks: ExpansionTaskDefinition[] = [
  {
    id: "simple_pink5_yellow6",
    displayName: "Pink 5 & Yellow 6",
    description: "pink 5 AND yellow 6",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won tricks that contain the PINK 5 and YELLOW 6",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Pink, number: 5 },
        { color: CardColor.Yellow, number: 6 },
      ]),
  },
  {
    id: "simple_yellow9_blue7",
    displayName: "Yellow 9 & Blue 7",
    description: "yellow 9 AND blue 7",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won tricks that contain the YELLOW 9 and BLUE 7",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Yellow, number: 9 },
        { color: CardColor.Blue, number: 7 },
      ]),
  },
  {
    id: "simple_pink1_green7",
    displayName: "Pink 1 & Green 7",
    description: "the pink 1 AND the green 7",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the PINK 1 and the GREEN 7 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Pink, number: 1 },
        { color: CardColor.Green, number: 7 },
      ]),
  },
  {
    id: "simple_green5_blue8",
    displayName: "Green 5 & Blue 8",
    description: "the green 5 AND the blue 8",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the GREEN 5 and the BLUE 8 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Green, number: 5 },
        { color: CardColor.Blue, number: 8 },
      ]),
  },
  {
    id: "simple_blue1_blue2_blue3",
    displayName: "Blue 1, 2 & 3",
    description: "the blue 1 AND the blue 2 AND the blue 3",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the BLUE 1, the BLUE 2 and the BLUE 3 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Blue, number: 1 },
        { color: CardColor.Blue, number: 2 },
        { color: CardColor.Blue, number: 3 },
      ]),
  },
  {
    id: "simple_green3_yellow4_yellow5",
    displayName: "Green 3 & Yellow 4,5",
    description: "the green 3 and the yellow 4 and the yellow 5",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 4,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the GREEN 3, YELLOW 4 and the YELLOW 5 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Green, number: 3 },
        { color: CardColor.Yellow, number: 4 },
        { color: CardColor.Yellow, number: 5 },
      ]),
  },
  {
    id: "simple_blue6_yellow7",
    displayName: "Blue 6 & Yellow 7",
    description: "the blue 6 AND the yellow 7",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the BLUE 6 and YELLOW 7 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Blue, number: 6 },
        { color: CardColor.Yellow, number: 7 },
      ]),
  },
  {
    id: "simple_pink8_blue5",
    displayName: "Pink 8 & Blue 5",
    description: "the pink 8 AND the blue 5",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the PINK 8 and the BLUE 5 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Pink, number: 8 },
        { color: CardColor.Blue, number: 5 },
      ]),
  },
  {
    id: "simple_pink9_yellow8",
    displayName: "Pink 9 & Yellow 8",
    description: "the pink 9 AND the yellow 8",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the PINK 9 and the YELLOW 8 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Pink, number: 9 },
        { color: CardColor.Yellow, number: 8 },
      ]),
  },
  {
    id: "simple_blue4",
    displayName: "Blue 4",
    description: "the blue 4",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the BLUE 4 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Blue, number: 4 },
      ]),
  },
  {
    id: "simple_black3",
    displayName: "3 Submarine",
    description: "the 3 submarine",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the BLACK 3 in any of their tricks",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Black, number: 3 },
      ]),
  },
  {
    id: "simple_yellow1",
    displayName: "Yellow 1",
    description: "the yellow 1",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the YELLOW 1 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Yellow, number: 1 },
      ]),
  },
  {
    id: "simple_green6",
    displayName: "Green 6",
    description: "the green 6",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the GREEN 6 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Green, number: 6 },
      ]),
  },
  {
    id: "simple_pink3",
    displayName: "Pink 3",
    description: "the pink 3",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    canEvaluateMidGame: true,
    evaluationDescription: "Current player has won the PINK 3 in any of the tricks that they won",
    evaluate: (tricks, playerId) =>
      evaluateCollectCards(tricks, playerId, [
        { color: CardColor.Pink, number: 3 },
      ]),
  },
];
