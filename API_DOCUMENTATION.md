# TeclaWEB API Documentation

## Overview
TeclaWEB is a full-stack theater management system with React frontend and Express.js backend. This document outlines all available API endpoints.

## Base URL
- Development: `http://localhost:5000`
- Production: `https://your-domain.com`

## Authentication
Most endpoints require authentication via session cookies. Admin/Monitor endpoints require specific roles.

## Endpoints

### Authentication

#### POST `/api/login`
Authenticate a user and create a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER"
}
```

#### POST `/api/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER"
}
```

#### POST `/api/logout`
Logout the current user and destroy session.

**Response:** `204 No Content`

#### GET `/api/user`
Get current authenticated user information.

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "name": "User Name",
  "role": "USER",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Posts (Blog)

#### GET `/api/posts`
Get all posts with optional filtering.

**Query Parameters:**
- `limit` (number): Maximum number of posts to return
- `status` (string): Filter by status ("PUBLISHED", "DRAFT")

**Response:**
```json
[
  {
    "id": "post-id",
    "title": "Post Title",
    "content": "Post content...",
    "excerpt": "Post excerpt...",
    "status": "PUBLISHED",
    "createdBy": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET `/api/posts/:id`
Get a specific post by ID.

**Response:**
```json
{
  "id": "post-id",
  "title": "Post Title",
  "content": "Post content...",
  "excerpt": "Post excerpt...",
  "status": "PUBLISHED",
  "createdBy": "user-id",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### POST `/api/posts`
Create a new post (Admin/Monitor only).

**Request Body:**
```json
{
  "title": "Post Title",
  "content": "Post content...",
  "excerpt": "Post excerpt...",
  "status": "DRAFT"
}
```

#### PUT `/api/posts/:id`
Update an existing post (Admin/Monitor only).

#### DELETE `/api/posts/:id`
Delete a post (Admin/Monitor only).

### Plays (Events)

#### GET `/api/plays`
Get all plays/events.

**Query Parameters:**
- `limit` (number): Maximum number of plays to return

**Response:**
```json
[
  {
    "id": "play-id",
    "title": "Play Title",
    "description": "Play description...",
    "dateTime": "2024-01-01T19:00:00.000Z",
    "basePrice": 15.00,
    "createdBy": "user-id",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### GET `/api/plays/:id`
Get a specific play by ID.

#### POST `/api/plays`
Create a new play (Admin/Monitor only).

#### PUT `/api/plays/:id`
Update an existing play (Admin/Monitor only).

#### DELETE `/api/plays/:id`
Delete a play (Admin/Monitor only).

### Tickets

#### GET `/api/tickets`
Get user's tickets (authenticated users only).

**Query Parameters:**
- `playId` (string): Filter by play ID
- `userId` (string): Filter by user ID (Admin/Monitor only)

**Response:**
```json
[
  {
    "id": "ticket-id",
    "playId": "play-id",
    "userId": "user-id",
    "seatNumber": "A1",
    "status": "Pendiente",
    "qrCode": "base64-encoded-qr-code",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "paidAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST `/api/tickets`
Purchase a new ticket (authenticated users only).

**Request Body:**
```json
{
  "playId": "play-id",
  "seatNumber": "A1"
}
```

#### GET `/api/tickets/:id/pdf`
Download ticket as PDF (authenticated users only).

### Validation System

#### POST `/api/validation/weekly-code`
Validate a weekly code.

**Request Body:**
```json
{
  "code": "12345"
}
```

**Response:**
```json
{
  "message": "Código válido",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2024-01-07T23:59:59.000Z"
}
```

#### POST `/api/validation/ticket/:id`
Validate a ticket with weekly code.

**Request Body:**
```json
{
  "weeklyCode": "12345"
}
```

**Response:**
```json
{
  "id": "ticket-id",
  "playTitle": "Play Title",
  "date": "01/01/2024",
  "time": "19:00",
  "price": 15.00,
  "seatNumber": "A1",
  "userName": "User Name",
  "status": "Pendiente",
  "paidAt": null,
  "qrCode": "base64-encoded-qr-code"
}
```

#### POST `/api/validation/confirm-payment/:id`
Confirm payment for a ticket.

**Request Body:**
```json
{
  "weeklyCode": "12345"
}
```

### Admin Endpoints

#### GET `/api/admin/weekly-code`
Get current weekly code (Admin only).

**Response:**
```json
{
  "code": "12345",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2024-01-07T23:59:59.000Z"
}
```

#### POST `/api/admin/weekly-code`
Update weekly code (Admin only).

**Request Body:**
```json
{
  "code": "12345",
  "validFrom": "2024-01-01T00:00:00.000Z",
  "validTo": "2024-01-07T23:59:59.000Z"
}
```

#### GET `/api/admin/validation-logs`
Get validation logs (Admin only).

**Response:**
```json
[
  {
    "id": "log-id",
    "ticketId": "ticket-id",
    "validatedAt": "2024-01-01T00:00:00.000Z",
    "validatedBy": "admin-user",
    "weeklyCode": "12345"
  }
]
```

#### GET `/api/admin/validation-stats`
Get validation statistics (Admin only).

**Response:**
```json
{
  "totalValidations": 150,
  "todayValidations": 25,
  "weeklyValidations": 75,
  "monthlyValidations": 150,
  "activeWeeklyCode": "12345",
  "lastValidation": "2024-01-01T00:00:00.000Z",
  "validationRate": 95
}
```

### Gallery

#### GET `/api/gallery`
Get gallery items.

**Query Parameters:**
- `visibility` (string): Filter by visibility ("PUBLIC", "PRIVATE")

#### POST `/api/gallery`
Upload gallery item (Admin/Monitor only).

#### DELETE `/api/gallery/:id`
Delete gallery item (Admin/Monitor only).

### Contact

#### POST `/api/contact`
Submit contact form.

**Request Body:**
```json
{
  "name": "Contact Name",
  "email": "contact@example.com",
  "subject": "Subject",
  "message": "Message content..."
}
```

#### GET `/api/contact`
Get contact messages (Admin only).

### File Upload

#### POST `/api/upload/image`
Upload image file (Admin/Monitor only).

#### POST `/api/upload/document`
Upload document file (Admin/Monitor only).

#### POST `/api/upload/any`
Upload any file type (Admin/Monitor only).

#### DELETE `/api/upload/:filename`
Delete uploaded file (Admin/Monitor only).

### Settings

#### GET `/api/settings/:key`
Get setting value (Admin only).

#### PUT `/api/settings/:key`
Update setting value (Admin only).

**Request Body:**
```json
{
  "value": "setting-value"
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

## Rate Limiting
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

## CORS
The API supports CORS for cross-origin requests from the frontend application.

## Session Management
Sessions are managed via HTTP-only cookies for security. Sessions expire after 24 hours of inactivity.
