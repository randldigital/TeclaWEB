import Database from 'better-sqlite3';

const sqlite = new Database('teclaweb.db');

console.log('Checking sessions table...');
try {
  const sessions = sqlite.prepare('SELECT * FROM sessions').all();
  console.log('Sessions in database:', sessions.length);
  sessions.forEach(session => {
    console.log('Session ID:', session.sid);
    console.log('Expires:', session.expire);
    console.log('---');
  });
} catch (error) {
  console.log('Error reading sessions:', error.message);
}

console.log('\nChecking users table...');
try {
  const users = sqlite.prepare('SELECT id, email, name, role FROM users').all();
  console.log('Users in database:', users.length);
  users.forEach(user => {
    console.log('User:', user.email, '- Role:', user.role);
  });
} catch (error) {
  console.log('Error reading users:', error.message);
}

sqlite.close();
