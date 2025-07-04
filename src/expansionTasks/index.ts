import { ExpansionTaskDefinition } from "./types";
export { ExpansionTaskDefinition, TaskState } from "./types";
import { simpleTasks } from "./taskSetSimple";
import { winCountTasks } from "./taskSetWinCount";

export function getAllExpansionTasks(): ExpansionTaskDefinition[] {
  return [...simpleTasks, ...winCountTasks];
}

export function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function getExpansionTaskDefinitionById(taskId: string) {
  const tasks = getAllExpansionTasks();
  return tasks.find(task => task.id === taskId);
}
export function selectExpansionTasks(
  desiredDifficulty: number,
  numPlayers: number
): ExpansionTaskDefinition[] {
  const tasks = getAllExpansionTasks().slice();
  shuffle(tasks);
  const selected: ExpansionTaskDefinition[] = [];

  const difficultyFor = (task: ExpansionTaskDefinition) => {
    switch (numPlayers) {
      case 3:
        return task.difficultyFor3;
      case 4:
        return task.difficultyFor4;
      case 5:
        return task.difficultyFor5;
      default:
        return task.difficultyFor5;
    }
  };

  let total = 0;
  for (const task of tasks) {
    const diff = difficultyFor(task);
    if (total + diff > desiredDifficulty) {
      continue;
    }
    selected.push(task);
    total += diff;
    if (total >= desiredDifficulty) {
      break;
    }
  }

  return selected;
}
