import { CardColor } from "../rooms/schema/CrewTypes";
import { ExpansionTaskDefinition, TaskState } from "./types";
import { evaluateExactColorCount, evaluateExactNumberCount } from "./taskHelpers";

export const exactCountTasks: ExpansionTaskDefinition[] = [
  {
    id: "exact_three_sixes",
    displayName: "Exactly Three 6s",
    description: "EXACTLY three 6s",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription: "Current player won exactly three 6s across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactNumberCount(tricks, playerId, { 6: 3 }),
  },
  {
    id: "exact_two_nines",
    displayName: "Exactly Two 9s",
    description: "EXACTLY two 9s",
    difficultyFor3: 2,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription: "Current player won exactly two 9s across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactNumberCount(tricks, playerId, { 9: 2 }),
  },
  {
    id: "exact_one_pink",
    displayName: "Exactly One Pink",
    description: "EXACTLY one pink",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription: "Current player has only won a SINGLE PINK card across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, { [CardColor.Pink]: 1 }),
  },
  {
    id: "exact_two_greens",
    displayName: "Exactly Two Greens",
    description: "EXACTLY two greens",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription: "Current player has won exactly two GREEN card across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, { [CardColor.Green]: 2 }),
  },
  {
    id: "exact_two_blues",
    displayName: "Exactly Two Blues",
    description: "EXACTLY two blue cards",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription: "Current player has won exactly two BLUE cards across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, { [CardColor.Blue]: 2 }),
  },
  {
    id: "exact_one_submarine",
    displayName: "Exactly One Submarine",
    description: "EXACTLY one submarine",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    evaluateMidGame: false,
    evaluationDescription: "Current player has only won a single BLACK card across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, { [CardColor.Black]: 1 }),
  },
  {
    id: "exact_two_submarines",
    displayName: "Exactly Two Submarines",
    description: "EXACTLY two submarines",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription: "Current player has won exactly two BLACK cards across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, { [CardColor.Black]: 2 }),
  },
  {
    id: "exact_three_submarines",
    displayName: "Exactly Three Submarines",
    description: "EXACTLY three submarines",
    difficultyFor3: 3,
    difficultyFor4: 4,
    difficultyFor5: 4,
    evaluateMidGame: false,
    evaluationDescription: "Current player has won exactly three BLACK card across all their tricks",
    evaluate: (tricks, playerId) =>
      evaluateExactColorCount(tricks, playerId, { [CardColor.Black]: 3 }),
  },
];
