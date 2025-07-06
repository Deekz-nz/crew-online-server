import { desc } from 'drizzle-orm';
import { db } from './connection';
import { highScoresTable, NewHighScore, HighScore } from './schema';
import { CrewGameState } from '../rooms/schema/CrewRoomState';
import { ExpansionTask } from '../rooms/schema/CrewTypes';

const dbAvailable = db !== null && db !== undefined;

/**
 * Insert a high score entry based on the finished game state.
 */
export async function addHighScoreFromState(state: CrewGameState): Promise<void> {
  if (!dbAvailable) {
    console.warn('Database not configured. High score will not be stored.');
    return;
  }
  const players = state.playerOrder.map(id => state.players.get(id)?.displayName || '');

  const tasks = state.allTasks.map(t => {
    const task = t as ExpansionTask;
    return {
      displayName: task.displayName,
      player: state.players.get(task.player)?.displayName || '',
      taskId: task.taskId,
      evaluationDescription: task.evaluationDescription,
      difficulty: task.difficulty,
    };
  });

  const difficulty = state.allTasks.reduce((sum, t) => sum + (t as ExpansionTask).difficulty, 0);

  const record: NewHighScore = {
    createdAt: new Date(),
    players,
    undoUsed: state.undoUsed,
    tasks,
    difficulty,
  };

  try {
    await db!.insert(highScoresTable).values(record);
  } catch (err) {
    console.error('failed to insert high score', err);
  }
}

export async function getHighScores(): Promise<HighScore[]> {
  if (!dbAvailable) return [];
  return db!.select().from(highScoresTable).orderBy(desc(highScoresTable.difficulty));
}

/**
 * Insert a randomly generated high score record.
 * Useful for testing the high score API.
 */
export async function addRandomHighScore(): Promise<HighScore | null> {
  if (!dbAvailable) {
    console.warn('Database not configured. Random high score not stored.');
    return null;
  }

  // generate between 3 and 5 players
  const playerCount = Math.floor(Math.random() * 3) + 3;
  const players: string[] = [];
  for (let i = 0; i < playerCount; i++) {
    players.push(`Player${i + 1}`);
  }

  const taskCount = Math.floor(Math.random() * 4) + 1;
  const tasks: {
    displayName: string;
    player: string;
    taskId: string;
    evaluationDescription: string;
    difficulty: number;
  }[] = [];
  for (let i = 0; i < taskCount; i++) {
    const player = players[Math.floor(Math.random() * players.length)];
    tasks.push({
      displayName: `Task ${i + 1}`,
      player,
      taskId: `task-${i + 1}`,
      evaluationDescription: `Evaluation ${i + 1}`,
      difficulty: Math.floor(Math.random() * 3) + 1,
    });
  }

  const record: NewHighScore = {
    createdAt: new Date(),
    players,
    undoUsed: Math.random() < 0.5,
    tasks,
    difficulty: tasks.reduce((sum, t) => sum + t.difficulty, 0),
  };

  const [result] = await db!.insert(highScoresTable).values(record).returning();
  return result;
}
