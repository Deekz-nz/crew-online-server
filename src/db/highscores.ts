import { desc } from 'drizzle-orm';
import { db } from './connection';
import { highScoresTable, NewHighScore, HighScore } from './schema';
import { CrewGameState } from '../rooms/schema/CrewRoomState';
import { ExpansionTask } from '../rooms/schema/CrewTypes';

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
    await db.insert(highScoresTable).values(record);
  } catch (err) {
    console.error('failed to insert high score', err);
  }
}

export async function getHighScores(): Promise<HighScore[]> {
  return db.select().from(highScoresTable).orderBy(desc(highScoresTable.difficulty));
}
