# TeclaWEB User Guide

## Overview
TeclaWEB is a comprehensive theater management system for the Colegio Claret Sevilla. This guide explains how to use all features of the application.

## Table of Contents
1. [Getting Started](#getting-started)
2. [User Roles](#user-roles)
3. [Public Features](#public-features)
4. [User Features](#user-features)
5. [Admin Features](#admin-features)
6. [Monitor Features](#monitor-features)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup
1. **Register an Account**
   - Visit the website
   - Click "Iniciar Sesión" in the top right
   - Click "Registrarse" to create a new account
   - Fill in your email, password, and name
   - Click "Crear cuenta"

2. **Login**
   - Enter your email and password
   - Click "Iniciar Sesión"
   - You'll be redirected to the home page

### Navigation
- **Header**: Contains logo, navigation menu, and user menu
- **Breadcrumbs**: Show your current location in the site
- **Footer**: Contains additional links and information

## User Roles

### Public User (Not Logged In)
- View blog posts
- View plays/events
- View gallery
- Submit contact form
- Register for an account

### Regular User (USER)
- All public features
- Purchase tickets
- View personal profile
- Download ticket PDFs
- View ticket history

### Monitor (MONITOR)
- All user features
- Access admin dashboard
- Create/edit posts
- Create/edit plays
- Upload gallery items
- Access validation tools

### Administrator (ADMIN)
- All monitor features
- Manage weekly validation codes
- View validation logs and statistics
- Manage contact messages
- Full system access

## Public Features

### Blog
- **Location**: Click "Blog" in the navigation menu
- **Features**:
  - Read published blog posts
  - View post details with full content
  - See post metadata (date, author, status)

### Plays/Events
- **Location**: Click "Obras" in the navigation menu
- **Features**:
  - View all upcoming plays
  - See play details (date, time, price, description)
  - Purchase tickets (if logged in)

### Gallery
- **Location**: Click "Galería" in the navigation menu
- **Features**:
  - View public gallery items
  - See images and descriptions

### Contact
- **Location**: Click "Contacto" in the navigation menu
- **Features**:
  - Submit contact form
  - Send messages to administrators
  - Receive confirmation of submission

## User Features

### Profile Management
- **Location**: Click your name in the top right → "Perfil"
- **Features**:
  - View personal information
  - See account details (role, join date)
  - View ticket history
  - Download ticket PDFs

### Ticket Purchase
1. **Navigate to Plays**: Click "Obras" in the navigation
2. **Select a Play**: Click on a play you want to attend
3. **Purchase Ticket**:
   - Select seat number (if available)
   - Click "Comprar Entrada"
   - Confirm purchase
4. **Receive Confirmation**:
   - Ticket will be created with QR code
   - Email confirmation will be sent
   - Ticket appears in your profile

### Ticket Management
- **View Tickets**: Go to your profile to see all tickets
- **Download PDF**: Click download button on any ticket
- **QR Code**: Each ticket has a unique QR code for validation

## Admin Features

### Admin Dashboard
- **Location**: Click your name → "Administración"
- **Overview Tab**:
  - View system statistics
  - Quick access to common actions
  - Role and user information

### Content Management

#### Posts (Blog)
- **Create Post**:
  1. Go to Admin Dashboard → Posts tab
  2. Click "Nuevo Post"
  3. Fill in title, content, and excerpt
  4. Set status (Draft/Published)
  5. Click "Crear Post"

- **Edit Post**:
  1. Find the post in the list
  2. Click the edit button
  3. Modify content as needed
  4. Click "Actualizar"

- **Delete Post**:
  1. Find the post in the list
  2. Click the delete button
  3. Confirm deletion

#### Plays (Events)
- **Create Play**:
  1. Go to Admin Dashboard → Plays tab
  2. Click "Nueva Obra"
  3. Fill in title, description, date/time, price
  4. Click "Crear Obra"

- **Edit Play**:
  1. Find the play in the list
  2. Click the edit button
  3. Modify details as needed
  4. Click "Actualizar"

- **Delete Play**:
  1. Find the play in the list
  2. Click the delete button
  3. Confirm deletion

#### Gallery
- **Upload Item**:
  1. Go to Admin Dashboard → Gallery tab
  2. Click "Subir Imagen"
  3. Select file and fill in details
  4. Set visibility (Public/Private)
  5. Click "Subir"

### Validation System

#### Weekly Code Management
- **Location**: Admin Dashboard → Validación tab
- **Set Weekly Code**:
  1. Enter a 5-digit code
  2. Set valid from/to dates
  3. Click "Actualizar Código"

- **View Current Code**:
  - See active code and validity period
  - Check if code is currently active

#### Validation Tools
- **Camera Validation**:
  1. Click "Abrir Validación" in admin dashboard
  2. Enter weekly code to unlock
  3. Use camera to scan ticket QR codes
  4. View validation results

- **Manual Validation**:
  1. Click "Validación Manual" in admin dashboard
  2. Enter weekly code
  3. Enter ticket ID manually
  4. View validation results

#### Validation Statistics
- **View Stats**: See validation metrics in admin dashboard
- **Metrics Available**:
  - Total validations
  - Today's validations
  - Weekly/monthly counts
  - Validation success rate
  - Last validation timestamp

#### Validation Logs
- **View Logs**: See all validation history
- **Log Details**:
  - Ticket ID
  - Validation timestamp
  - Validator information
  - Weekly code used

### Contact Management
- **Location**: Admin Dashboard → Mensajes tab
- **Features**:
  - View all contact form submissions
  - Mark messages as read/unread
  - Reply to messages (email integration)
  - Filter by status

### File Upload
- **Image Upload**: Upload images for gallery and posts
- **Document Upload**: Upload PDFs and other documents
- **File Management**: Delete uploaded files as needed

## Monitor Features

Monitors have access to most admin features except:
- Weekly code management
- Validation statistics
- Contact message management
- System settings

## Troubleshooting

### Common Issues

#### Can't Login
- **Check Credentials**: Ensure email and password are correct
- **Reset Password**: Contact administrator if you forgot password
- **Account Status**: Ensure your account is active

#### Ticket Purchase Fails
- **Check Availability**: Ensure seats are available
- **Check Date**: Ensure play hasn't passed
- **Check Login**: Ensure you're logged in
- **Try Again**: Refresh page and try again

#### Validation Issues
- **Check Weekly Code**: Ensure code is correct and active
- **Check Ticket**: Ensure ticket ID is valid
- **Check Permissions**: Ensure you have validation access
- **Check Network**: Ensure stable internet connection

#### Admin Access Issues
- **Check Role**: Ensure your account has admin/monitor role
- **Contact Administrator**: If role assignment is needed
- **Logout/Login**: Try logging out and back in

### Error Messages

#### "Acceso denegado"
- You don't have permission for this feature
- Contact administrator for role assignment

#### "Código semanal inválido"
- Weekly code is incorrect or expired
- Contact administrator for current code

#### "Ticket no encontrado"
- Ticket ID is invalid or doesn't exist
- Check ticket ID carefully

#### "Error interno del servidor"
- System error occurred
- Try again later or contact administrator

### Performance Tips

#### For Users
- Use modern browsers (Chrome, Firefox, Safari, Edge)
- Keep browser updated
- Clear cache if experiencing issues
- Use stable internet connection

#### For Admins
- Upload optimized images for gallery
- Use appropriate file sizes for uploads
- Regularly backup important data
- Monitor validation logs for issues

### Support

#### Getting Help
1. **Check this guide** for common solutions
2. **Contact administrators** for account issues
3. **Submit contact form** for general inquiries
4. **Check system status** if experiencing widespread issues

#### Reporting Issues
When reporting issues, include:
- Your role (User/Monitor/Admin)
- Browser and version
- Steps to reproduce
- Error messages
- Screenshots if helpful

## Best Practices

### For Users
- Keep your password secure
- Log out when using shared computers
- Download and save important tickets
- Check play details before purchasing

### For Admins
- Regularly update weekly codes
- Monitor validation statistics
- Respond to contact messages promptly
- Backup important data regularly
- Test validation tools before events

### For Monitors
- Verify weekly codes before events
- Test validation tools
- Keep validation logs organized
- Report issues to administrators

## Security Notes

### Password Security
- Use strong, unique passwords
- Don't share your login credentials
- Log out when finished
- Report suspicious activity

### Data Privacy
- Personal information is protected
- Tickets contain personal data
- Validation logs are secure
- Contact information is private

### System Security
- Weekly codes are time-limited
- QR codes are unique per ticket
- Validation requires proper authentication
- Admin access is role-based
