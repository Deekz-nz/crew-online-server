import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { parse } from 'pg-connection-string';

// Parse connection details from DATABASE_URL. This avoids issues where
// the connection string isn't parsed correctly by `pg` when undefined or
// malformed.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL env variable not set');
}

const cfg = parse(connectionString);

const pool = new Pool({
  host: cfg.host,
  port: cfg.port ? parseInt(cfg.port, 10) : undefined,
  user: cfg.user,
  password: cfg.password ?? '',
  database: cfg.database,
});

export const db = drizzle(pool);
