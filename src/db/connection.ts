import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

let dbInstance: ReturnType<typeof drizzle> | null = null;

const databaseUrl = process.env.DATABASE_URL;
if (typeof databaseUrl === 'string' && databaseUrl.length > 0) {
  dbInstance = drizzle(process.env.DATABASE_URL!);
  console.log("✅ Database initialised");

} else {
  console.warn(
    'DATABASE_URL environment variable not set. High score features are disabled.'
  );
}

export const db = dbInstance;
