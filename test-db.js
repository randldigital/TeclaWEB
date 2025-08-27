import Database from 'better-sqlite3';
const db = new Database('teclaweb.db');

console.log('=== Database Contents ===');

// Check users
console.log('\n--- Users ---');
const users = db.prepare('SELECT id, email, name, role FROM users').all();
console.log(users);

// Check plays
console.log('\n--- Plays ---');
const plays = db.prepare('SELECT id, title, created_by FROM plays').all();
console.log(plays);

// Check tickets
console.log('\n--- Tickets ---');
const tickets = db.prepare('SELECT id, user_id, play_id, status FROM tickets').all();
console.log(tickets);

// Check settings
console.log('\n--- Settings ---');
const settings = db.prepare('SELECT key, value FROM settings').all();
console.log(settings);

db.close(); 