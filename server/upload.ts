import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { fileTypeFromBuffer } from 'file-type';
import { detectImageOrientation, ImageMetadata } from './image-orientation';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueName = `${nanoid()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter for images with content validation
const imageFilter = async (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  // First check MIME type
  if (!allowedMimes.includes(file.mimetype)) {
    return cb(new Error('Only image files are allowed'));
  }
  
  // Additional content validation will be done in the route handler
  cb(null, true);
};

// File filter for documents
const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only document files are allowed'));
  }
};

// Create multer instances
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  }
});

export const uploadDocument = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export const uploadAny = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper function to get file URL
export function getFileUrl(filename: string): string {
  return `/uploads/${filename}`;
}

// Helper function to validate file content
export async function validateFileContent(filePath: string, expectedTypes: string[]): Promise<boolean> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileType = await fileTypeFromBuffer(fileBuffer);
    
    if (!fileType) {
      return false;
    }
    
    return expectedTypes.includes(fileType.mime);
  } catch (error) {
    console.error('Error validating file content:', error);
    return false;
  }
}

// Helper function to detect image orientation
export async function detectImageOrientationFromFile(filePath: string): Promise<ImageMetadata | null> {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return await detectImageOrientation(fileBuffer);
  } catch (error) {
    console.error('Error detecting image orientation from file:', error);
    return null;
  }
}

// Helper function to delete file
export function deleteFile(filename: string): boolean {
  try {
    const filePath = path.join(uploadsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
} 