# Overview

This is a theater school web application built for Colegio Claret Sevilla, featuring a modern full-stack architecture with React frontend and Express backend. The application serves as both a public-facing website and a reservation system for theater events, supporting multiple user roles (Admin, Monitor/Teacher, and Registered Users) with different permission levels.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom Claret Sevilla theme colors (blue, navy, yellow, red)
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and building

## Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ESM modules
- **Authentication**: Passport.js with local strategy using bcryptjs for password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API with role-based access control

## Database Layer
- **Database**: PostgreSQL (configured for Neon serverless)
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle migrations with shared schema definitions
- **Connection**: Connection pooling with @neondatabase/serverless

## Authentication & Authorization
- **Strategy**: Custom authentication system independent of Replit auth
- **Password Security**: Scrypt-based password hashing with salt
- **Session Storage**: PostgreSQL-backed sessions for persistence
- **Role-Based Access**: Three-tier role system (ADMIN, MONITOR, USER)
- **Route Protection**: Protected routes with role-specific access control

## Data Models
- **Users**: Email-based authentication with roles and profiles
- **Posts**: Blog/news system with status management (PUBLISHED, DRAFT, HIDDEN)
- **Plays**: Theater events with posters, descriptions, dates, and pricing
- **Tickets**: Reservation system linking users to plays with QR codes
- **Gallery**: Image management with public/private visibility
- **Contact Messages**: Contact form submissions storage
- **Settings**: Application configuration storage

## File Structure
- **Monorepo Setup**: Shared schema and types between client and server
- **Client**: React application in `/client` directory
- **Server**: Express API in `/server` directory  
- **Shared**: Common TypeScript definitions in `/shared` directory

## Key Features
- **Multi-language Support**: Spanish content with date formatting
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Image Handling**: Poster and gallery image management
- **PDF Generation**: Ticket generation with QR codes (implementation pending)
- **Email Integration**: User notifications (implementation pending)

# External Dependencies

## Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection Pooling**: WebSocket-based connections for serverless environments

## UI Libraries
- **Radix UI**: Comprehensive set of unstyled, accessible UI primitives
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library built on Radix UI

## Validation & Forms
- **Zod**: Runtime type validation for forms and API endpoints
- **React Hook Form**: Performant forms with validation integration

## Date & Time
- **date-fns**: Date manipulation and formatting with Spanish locale support

## Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the entire application
- **ESLint/Prettier**: Code quality and formatting (implied by structure)

## Authentication
- **Passport.js**: Authentication middleware
- **bcryptjs**: Password hashing and verification
- **connect-pg-simple**: PostgreSQL session store

## Styling
- **Tailwind CSS**: Utility-first CSS framework
- **PostCSS**: CSS processing with autoprefixer

## State Management
- **TanStack Query**: Server state management with caching and synchronization