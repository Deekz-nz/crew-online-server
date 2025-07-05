/**
 * IMPORTANT:
 * ---------
 * Do not manually edit this file if you'd like to host your server on Colyseus Cloud
 *
 * If you're self-hosting (without Colyseus Cloud), you can manually
 * instantiate a Colyseus Server as documented here:
 *
 * See: https://docs.colyseus.io/server/api/#constructor-options
 */

import 'dotenv/config';
import './db/connection';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

// Import Colyseus config
import app from "./app.config";
import { db } from './db/connection';


// run only in non-local environments if needed
migrate(db, { migrationsFolder: './drizzle' });

import { listen } from "@colyseus/tools";

// Create and listen on 2567 (or PORT environment variable.)
listen(app);

