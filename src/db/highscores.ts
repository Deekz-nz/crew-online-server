import { desc } from 'drizzle-orm';
import { db } from './connection';
import { highScoresTable, NewHighScore, HighScore } from './schema';
import { CrewGameState } from '../rooms/schema/CrewRoomState';
import { ExpansionTask } from '../rooms/schema/CrewTypes';

/**
 * Insert a high score record into the database.
 */
export async function addHighScore(record: NewHighScore): Promise<void> {
  await db.insert(highScoresTable).values(record);
}

/**
 * Insert a high score entry based on the finished game state.
 */
export async function addHighScoreFromState(state: CrewGameState): Promise<void> {
  const players = state.playerOrder.map(id => state.players.get(id)?.displayName || '');

  const tasks = state.allTasks.map(t => {
    const task = t as ExpansionTask;
    return {
      displayName: task.displayName,
      player: state.players.get(task.player)?.displayName || '',
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
    await addHighScore(record);
  } catch (err) {
    console.error('failed to insert high score', err);
  }
}

export async function getHighScores(): Promise<HighScore[]> {
  return db.select().from(highScoresTable).orderBy(desc(highScoresTable.difficulty));
}

/**
 * Generate a random high score record for testing purposes.
 */
export function generateRandomHighScore(): NewHighScore {
  const names = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'];
  const shuffled = names.sort(() => Math.random() - 0.5);
  const players = shuffled.slice(0, Math.floor(Math.random() * 3) + 2);

  const taskCount = Math.floor(Math.random() * 3) + 1;
  const tasks = Array.from({ length: taskCount }, (_, i) => ({
    displayName: `Task ${i + 1}`,
    player: players[i % players.length],
  }));

  const difficulty = Math.floor(Math.random() * 10) + 1;

  return {
    createdAt: new Date(),
    players,
    undoUsed: Math.random() < 0.5,
    tasks,
    difficulty,
  };
}
