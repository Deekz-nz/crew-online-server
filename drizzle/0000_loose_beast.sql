CREATE TABLE "high_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"players" jsonb NOT NULL,
	"undo_used" boolean NOT NULL,
	"tasks" jsonb NOT NULL,
	"difficulty" integer NOT NULL
);
