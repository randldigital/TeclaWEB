# TeclaWEB Development Setup Guide

## Overview
This guide helps developers set up the TeclaWEB project for local development and contribution.

## Prerequisites

### Required Software
- **Node.js**: Version 18 or higher
- **npm**: Version 8 or higher
- **Git**: For version control
- **SQLite**: For local database (usually included with Node.js)

### Optional Software
- **VS Code**: Recommended IDE with extensions
- **Postman**: For API testing
- **SQLite Browser**: For database inspection

## Project Structure

```
TeclaWEB/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   ├── pages/         # Page components
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
├── server/                # Express.js backend
│   ├── auth.js           # Authentication logic
│   ├── db-sqlite.js      # Database configuration
│   ├── email.js          # Email service
│   ├── index.js          # Server entry point
│   ├── pdf.js            # PDF generation
│   ├── routes.js         # API routes
│   ├── storage-db.ts     # Database operations
│   └── upload.js         # File upload handling
├── shared/               # Shared code between client/server
│   └── schema.ts         # Database schema definitions
├── migrations/           # Database migrations
├── uploads/              # Uploaded files
├── package.json          # Root dependencies
└── tsconfig.json         # TypeScript configuration
```

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd TeclaWEB
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### 3. Environment Setup

Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=sqlite:./teclaweb.db

# Server
PORT=5000
NODE_ENV=development

# Email (optional for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Session Secret
SESSION_SECRET=your-session-secret-here

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
```

### 4. Database Setup

Initialize the database:
```bash
# Run database migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. Build the Project

```bash
# Build both client and server
npm run build

# Or build separately
npm run build:client
npm run build:server
```

## Development Workflow

### Starting Development Server

```bash
# Start development server (both client and server)
npm run dev

# Or start separately
npm run dev:client  # Frontend development server
npm run dev:server  # Backend development server
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:client       # Start frontend only
npm run dev:server       # Start backend only

# Building
npm run build            # Build for production
npm run build:client     # Build frontend only
npm run build:server     # Build backend only

# Database
npm run db:migrate       # Run database migrations
npm run db:seed          # Seed database with test data
npm run db:reset         # Reset database

# Testing
npm run test             # Run all tests
npm run test:client      # Run frontend tests
npm run test:server      # Run backend tests

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues

# Type checking
npm run type-check       # Run TypeScript type checking
```

## Development Tools

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Database Development

### SQLite Database

The project uses SQLite for development. The database file is located at:
```
./teclaweb.db
```

### Database Schema

Key tables:
- `users`: User accounts and authentication
- `posts`: Blog posts and content
- `plays`: Theater events and plays
- `tickets`: User ticket purchases
- `gallery_items`: Image gallery
- `contact_messages`: Contact form submissions
- `settings`: System configuration

### Database Operations

```bash
# View database schema
sqlite3 teclaweb.db ".schema"

# View specific table
sqlite3 teclaweb.db ".schema users"

# Run SQL query
sqlite3 teclaweb.db "SELECT * FROM users;"

# Backup database
sqlite3 teclaweb.db ".backup backup.db"
```

## API Development

### Testing API Endpoints

Use the provided test data or create your own:

```bash
# Test weekly code validation
curl -X POST http://localhost:5000/api/validation/weekly-code \
  -H "Content-Type: application/json" \
  -d '{"code": "12345"}'

# Test ticket validation
curl -X POST http://localhost:5000/api/validation/ticket/TICKET-1234567890-abc123 \
  -H "Content-Type: application/json" \
  -d '{"weeklyCode": "12345"}'
```

### API Documentation

See `API_DOCUMENTATION.md` for complete API reference.

## Frontend Development

### Component Structure

```
components/
├── ui/                   # Reusable UI components
├── layout/              # Layout components
├── admin/               # Admin-specific components
└── forms/               # Form components
```

### Styling

The project uses:
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Radix UI**: Headless UI primitives

### State Management

- **TanStack Query**: Server state management
- **React Hook Form**: Form state management
- **Context API**: Global state (auth, theme)

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
__tests__/
├── components/          # Component tests
├── pages/              # Page tests
├── hooks/              # Hook tests
└── utils/              # Utility tests
```

## Deployment

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

Production environment variables:
```env
NODE_ENV=production
DATABASE_URL=your-production-database-url
SESSION_SECRET=your-production-session-secret
SMTP_HOST=your-smtp-host
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
```

## Troubleshooting

### Common Issues

#### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
npm run clean
npm run build
```

#### Database Issues
```bash
# Reset database
npm run db:reset

# Check database file
ls -la teclaweb.db

# Repair database
sqlite3 teclaweb.db "VACUUM;"
```

#### Port Conflicts
```bash
# Check what's using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

#### TypeScript Errors
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix import issues
npm run fix-imports
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

### Logs

Check server logs:
```bash
# View real-time logs
tail -f logs/app.log

# View error logs
tail -f logs/error.log
```

## Contributing

### Code Style

- Use Prettier for formatting
- Follow ESLint rules
- Use TypeScript for type safety
- Write meaningful commit messages

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create pull request
git push origin feature/your-feature-name
```

### Commit Message Format

```
type(scope): description

feat: new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

## Support

### Getting Help

1. Check this documentation
2. Review existing issues
3. Create a new issue with details
4. Contact the development team

### Issue Template

When creating issues, include:
- Environment details
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs
- Screenshots if applicable
