// Use SQLite for both development and production
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('teclaweb.db');
export const db = drizzle(sqlite, { schema });

// Export a mock pool for compatibility
export const pool = {
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve()
};
