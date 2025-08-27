import Database from 'better-sqlite3';

const sqlite = new Database('teclaweb.db');

console.log('=== Testing Database Directly ===');

// Test user query
console.log('\n--- Testing User Query ---');
const userResult = sqlite.prepare('SELECT * FROM users WHERE id = ?').get('-63PDF966BPyaQk_wZsEZ');
console.log('User result:', userResult);

// Test play query
console.log('\n--- Testing Play Query ---');
const playResult = sqlite.prepare('SELECT * FROM plays WHERE id = ?').get('DE4jgidjRPkrHkIKqBw_R');
console.log('Play result:', playResult);

// Test ticket query
console.log('\n--- Testing Ticket Query ---');
const ticketResult = sqlite.prepare('SELECT * FROM tickets WHERE id = ?').get('TICKET-1756214993403-nl265v1u6');
console.log('Ticket result:', ticketResult);

sqlite.close(); 