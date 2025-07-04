export enum TaskState {
  COMPLETED = "completed",
  FAILED = "failed",
  IN_PROGRESS = "in_progress"
}

import { Trick } from "../rooms/schema/CrewTypes";

export interface ExpansionTaskDefinition {
  id: string;
  displayName: string;
  description: string;
  difficultyFor3: number;
  difficultyFor4: number;
  difficultyFor5: number;
  canEvaluateMidGame: boolean;
  evaluationDescription: string;
  evaluate: (tricks: Trick[], playerId: string) => TaskState;
}
