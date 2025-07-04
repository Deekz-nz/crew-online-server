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
  /**
   * Whether this task can be evaluated during the game. If `true` the task
   * may be marked as completed as soon as the condition is met. If `false`
   * the final result can only be determined after the last trick, although
   * the task can still fail early.
   */
  evaluateMidGame: boolean;
  evaluationDescription: string;
  evaluate: (tricks: Trick[], playerId: string) => TaskState;
}
