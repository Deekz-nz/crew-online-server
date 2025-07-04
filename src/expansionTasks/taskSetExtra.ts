import { ExpansionTask } from "./types";
import { TaskState } from "../rooms/schema/CrewTypes";

export const extraTasks: ExpansionTask[] = [
  {
    id: "extra_placeholder_1",
    displayName: "Extra Placeholder 1",
    description: "Replace with real expansion task",
    difficultyFor3: 3,
    difficultyFor4: 3,
    difficultyFor5: 3,
    canEvaluateMidGame: true,
    evaluationDescription: "Placeholder evaluation logic",
    evaluate: () => TaskState.IN_PROGRESS,
  },
];
