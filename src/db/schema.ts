import {
  pgTable,
  serial,
  timestamp,
  jsonb,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

/**
 * Table storing completed expansion games that resulted in a high score.
 */
export const highScoresTable = pgTable("high_scores", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: false, mode: "date" })
    .notNull()
    .defaultNow(),
  players: jsonb("players").notNull().$type<string[]>(),
  undoUsed: boolean("undo_used").notNull(),
  tasks: jsonb("tasks").notNull().$type<{ displayName: string; player: string }[]>(),
  difficulty: integer("difficulty").notNull(),
});

export type HighScore = InferSelectModel<typeof highScoresTable>;
export type NewHighScore = InferInsertModel<typeof highScoresTable>;
