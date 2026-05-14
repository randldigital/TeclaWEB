const fs = require('fs');
const path = require('path');

// Load .env file
const envPath = path.join(__dirname, '.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    // Skip comments and empty lines
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove quotes if present
        envVars[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
}

module.exports = {
  apps: [{
    name: 'teclaweb',
    script: 'dist/server/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      ...envVars  // Merge .env variables
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
