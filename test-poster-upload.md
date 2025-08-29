# Poster Upload Functionality Test

## Overview
This document outlines the testing steps for the new poster upload functionality in play creation and editing.

## Test Cases

### 1. Create Play with Poster Upload
**Steps:**
1. Navigate to admin dashboard
2. Click "Crear Obra"
3. Fill in play details (title, description, date, price, genre)
4. Upload a poster image using drag & drop or file picker
5. Verify image preview appears
6. Submit the form
7. Verify play is created with poster

**Expected Results:**
- Image uploads successfully
- Preview shows immediately after upload
- Form submission includes poster URL
- Play displays with poster on booking page

### 2. Edit Play with Poster Upload
**Steps:**
1. Navigate to admin dashboard
2. Click "Editar" on an existing play
3. Upload a new poster image
4. Verify "Nueva imagen" badge appears
5. Submit the form
6. Verify play updates with new poster

**Expected Results:**
- Existing poster shows initially
- New poster uploads successfully
- "Nueva imagen" badge appears
- Play updates with new poster

### 3. Remove Poster
**Steps:**
1. Open create or edit play form
2. Upload a poster image
3. Click the X button to remove poster
4. Submit the form

**Expected Results:**
- Poster is removed from preview
- Form submits without poster URL
- Play displays with default gradient background

### 4. Image Validation
**Steps:**
1. Try uploading non-image files
2. Try uploading files larger than 5MB
3. Try uploading unsupported formats

**Expected Results:**
- Non-image files are rejected
- Large files show error message
- Unsupported formats show error message

### 5. Booking Page Display
**Steps:**
1. Create a play with poster
2. Navigate to the play's booking page
3. Verify poster displays correctly
4. Test responsive design on different screen sizes

**Expected Results:**
- Poster displays with proper aspect ratio
- Hover effects work correctly
- Responsive design works on mobile/tablet
- Fallback shows if image fails to load

## Technical Implementation Details

### Files Modified:
- `client/src/components/create-play-form.tsx` - Added poster upload
- `client/src/components/edit-play-form.tsx` - Added poster upload
- `client/src/pages/event-detail.tsx` - Enhanced poster display
- `client/src/components/image-preview.tsx` - New reusable component

### Features Implemented:
- Drag & drop file upload
- Image preview with remove functionality
- Form validation and error handling
- Responsive image display
- Loading states and error fallbacks
- Hover effects and animations

### File Upload Specifications:
- **Supported formats**: JPG, PNG, WebP
- **Maximum size**: 5MB
- **Recommended dimensions**: 800x1200px (portrait)
- **Storage**: Local uploads directory
- **URL format**: `/uploads/filename.ext`

## Notes
- Uses existing FileUpload component and infrastructure
- Leverages existing multer configuration
- Maintains consistency with gallery upload functionality
- Provides excellent user experience with immediate feedback
