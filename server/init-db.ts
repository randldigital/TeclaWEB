import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function initDatabase() {
  const sqlite = new Database('teclaweb.db');

// Drop existing tables to start fresh
sqlite.exec(`
  DROP TABLE IF EXISTS sessions;
  DROP TABLE IF EXISTS contact_messages;
  DROP TABLE IF EXISTS settings;
  DROP TABLE IF EXISTS gallery_items;
  DROP TABLE IF EXISTS tickets;
  DROP TABLE IF EXISTS plays;
  DROP TABLE IF EXISTS posts;
  DROP TABLE IF EXISTS users;
`);

// Create tables
sqlite.exec(`
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    google_id TEXT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'USER' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'PUBLISHED' NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE plays (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    poster_url TEXT,
    date_time DATETIME NOT NULL,
    base_price REAL DEFAULT 5.0 NOT NULL,
    genre TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    play_id TEXT NOT NULL,
    qr_code TEXT NOT NULL,
    seat_number TEXT,
    status TEXT DEFAULT 'Pendiente' NOT NULL,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (play_id) REFERENCES plays(id)
  );

  CREATE TABLE gallery_items (
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

  CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (updated_by) REFERENCES users(id)
  );

  CREATE TABLE contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'UNREAD' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
  );

  CREATE TABLE sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expire DATETIME NOT NULL
  );
`);

// Insert test data
const adminId = nanoid();

// Create admin user
const adminPassword = await hashPassword('admin123');
sqlite.prepare(`
  INSERT INTO users (id, email, password, name, role)
  VALUES (?, ?, ?, ?, ?)
`).run(adminId, 'admin@teclaweb.com', adminPassword, 'Admin User', 'ADMIN');

// Create test play
const playId = nanoid();
sqlite.prepare(`
  INSERT INTO plays (id, title, description, date_time, base_price, created_by)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(playId, 'Romeo y Julieta', 'Una tragedia de amor clásica', '2025-03-15 20:00:00', 15.0, adminId);

// Create weekly code settings
const now = new Date();
const validFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
const validTo = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

sqlite.prepare(`
  INSERT INTO settings (id, key, value, updated_by)
  VALUES (?, ?, ?, ?)
`).run(nanoid(), 'weekly_code', '12345', adminId);

sqlite.prepare(`
  INSERT INTO settings (id, key, value, updated_by)
  VALUES (?, ?, ?, ?)
`).run(nanoid(), 'weekly_code_valid_from', validFrom.toISOString(), adminId);

sqlite.prepare(`
  INSERT INTO settings (id, key, value, updated_by)
  VALUES (?, ?, ?, ?)
`).run(nanoid(), 'weekly_code_valid_to', validTo.toISOString(), adminId);

// Create test tickets
const testTicket1 = 'TICKET-1756214993403-nl265v1u6';
const testTicket2 = 'TICKET-1756214993404-abc123def';
const testTicket3 = 'TICKET-1756215517380-zozlc79fx';
const testTicket4 = 'TICKET-1756287933457-jy598algs';

// Generate QR codes for test tickets
const generateQR = async (ticketId: string) => {
  const QRCode = await import('qrcode');
  const buffer = await QRCode.toBuffer(ticketId, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#FFFFFF' },
    errorCorrectionLevel: 'M',
    type: 'png'
  });
  return buffer.toString('base64');
};

// Insert test tickets
const insertTicket = async (ticketId: string, seatNumber: string, status: string) => {
  const qrCode = await generateQR(ticketId);
  sqlite.prepare(`
    INSERT INTO tickets (id, user_id, play_id, qr_code, seat_number, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ticketId, adminId, playId, qrCode, seatNumber, status);
};

// Initialize tickets
const initTickets = async () => {
  await insertTicket(testTicket1, 'A1', 'Pendiente');
  await insertTicket(testTicket2, 'C3', 'Pagado');
  await insertTicket(testTicket3, 'B2', 'Pagado');
  await insertTicket(testTicket4, 'D4', 'Pagado');
};

await initTickets();

console.log('✅ Database initialized successfully!');
console.log('📊 Tables created: users, posts, plays, tickets, gallery_items, settings, contact_messages, sessions');
console.log('👤 Admin user created: admin@teclaweb.com / admin123');
console.log('🎭 Test play created: Romeo y Julieta');
console.log('🎫 Test tickets created with QR codes');
console.log('🔑 Weekly code set: 12345');

  sqlite.close();
}

initDatabase().catch(console.error); 