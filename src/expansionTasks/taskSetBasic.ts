import { ExpansionTaskDefinition, TaskState } from "./types";

export const basicTasks: ExpansionTaskDefinition[] = [
  {
    id: "basic_placeholder_1",
    displayName: "Basic Placeholder 1",
    description: "Replace with real expansion task",
    difficultyFor3: 1,
    difficultyFor4: 1,
    difficultyFor5: 1,
    canEvaluateMidGame: true,
    evaluationDescription: "Placeholder evaluation logic",
    evaluate: () => TaskState.IN_PROGRESS,
  },
  {
    id: "basic_placeholder_2",
    displayName: "Basic Placeholder 2",
    description: "Replace with real expansion task",
    difficultyFor3: 2,
    difficultyFor4: 2,
    difficultyFor5: 2,
    canEvaluateMidGame: false,
    evaluationDescription: "Placeholder evaluation logic",
    evaluate: () => TaskState.IN_PROGRESS,
  },
];
