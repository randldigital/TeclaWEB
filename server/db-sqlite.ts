import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

const sqlite = new Database('teclaweb.db');
export const db = drizzle(sqlite, { schema });

// Initialize database with tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    google_id TEXT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'USER' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    image_orientation TEXT,
    status TEXT DEFAULT 'PUBLISHED' NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS plays (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    poster_url TEXT,
    poster_orientation TEXT,
    date_time DATETIME NOT NULL,
    base_price REAL DEFAULT 5.0 NOT NULL,
    genre TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    parent_play_id TEXT,
    showtime_order INTEGER DEFAULT 0,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    play_id TEXT NOT NULL,
    qr_code TEXT NOT NULL,
    seat_number TEXT,
    status TEXT DEFAULT 'Pendiente' NOT NULL,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL,
    adult_tickets INTEGER DEFAULT 1 NOT NULL,
    child_tickets INTEGER DEFAULT 0 NOT NULL,
    total_price REAL DEFAULT 0.0 NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (play_id) REFERENCES plays(id)
  );

  CREATE TABLE IF NOT EXISTS gallery_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    type TEXT DEFAULT 'IMAGE' NOT NULL,
    visibility TEXT DEFAULT 'PUBLIC' NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'UNREAD' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE IF NOT EXISTS play_comments (
    id TEXT PRIMARY KEY,
    play_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (play_id) REFERENCES plays(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS play_memory_photos (
    id TEXT PRIMARY KEY,
    play_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (play_id) REFERENCES plays(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire DATETIME NOT NULL
  );
`);

// Add missing columns to existing plays table
try {
  sqlite.exec(`
    -- Add poster_orientation column if it doesn't exist
    ALTER TABLE plays ADD COLUMN poster_orientation TEXT;
  `);
} catch (error) {
  // Column might already exist, ignore error
}

try {
  sqlite.exec(`
    -- Add parent_play_id column if it doesn't exist  
    ALTER TABLE plays ADD COLUMN parent_play_id TEXT;
  `);
} catch (error) {
  // Column might already exist, ignore error
}

try {
  sqlite.exec(`
    -- Add showtime_order column if it doesn't exist
    ALTER TABLE plays ADD COLUMN showtime_order INTEGER DEFAULT 0;
  `);
} catch (error) {
  // Column might already exist, ignore error
}

// Update existing plays to set themselves as their own parent
sqlite.exec(`
  UPDATE plays SET parent_play_id = id WHERE parent_play_id IS NULL;
`);

// Create index for better performance when querying by parent_play_id
sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_plays_parent_play_id ON plays (parent_play_id);
`); 

sqlite.exec(`
  CREATE INDEX IF NOT EXISTS idx_play_comments_play_id ON play_comments (play_id);
  CREATE INDEX IF NOT EXISTS idx_play_comments_status ON play_comments (status);
  CREATE INDEX IF NOT EXISTS idx_play_memory_photos_play_id ON play_memory_photos (play_id);
`);