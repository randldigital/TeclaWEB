import sharp from 'sharp';

export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export interface ImageMetadata {
  width: number;
  height: number;
  orientation: ImageOrientation;
  aspectRatio: number;
}

/**
 * Detect image orientation from buffer using Sharp
 * @param buffer - Image buffer
 * @returns Promise<ImageMetadata>
 */
export async function detectImageOrientation(buffer: Buffer): Promise<ImageMetadata> {
  try {
    const metadata = await sharp(buffer).metadata();
    
    if (!metadata.width || !metadata.height) {
      throw new Error('Could not extract image dimensions');
    }
    
    const aspectRatio = metadata.width / metadata.height;
    
    let orientation: ImageOrientation;
    if (aspectRatio > 1.2) {
      orientation = 'landscape';
    } else if (aspectRatio < 0.8) {
      orientation = 'portrait';
    } else {
      orientation = 'square';
    }
    
    return {
      width: metadata.width,
      height: metadata.height,
      orientation,
      aspectRatio
    };
  } catch (error) {
    console.error('Error detecting image orientation:', error);
    // Default to square if detection fails
    return {
      width: 0,
      height: 0,
      orientation: 'square',
      aspectRatio: 1
    };
  }
}

/**
 * Get orientation from aspect ratio
 * @param aspectRatio - Width / Height ratio
 * @returns ImageOrientation
 */
export function getOrientationFromAspectRatio(aspectRatio: number): ImageOrientation {
  if (aspectRatio > 1.2) return 'landscape';
  if (aspectRatio < 0.8) return 'portrait';
  return 'square';
}

/**
 * Get CSS classes for orientation-based layout
 * @param orientation - Image orientation
 * @param screenSize - Screen size ('mobile', 'tablet', 'desktop')
 * @returns CSS classes string
 */
export function getLayoutClasses(orientation: ImageOrientation, screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'): string {
  // Always stack on mobile
  if (screenSize === 'mobile') {
    return 'flex flex-col space-y-4';
  }
  
  // Desktop/tablet layouts based on orientation
  switch (orientation) {
    case 'landscape':
      return 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start';
    case 'portrait':
      return 'flex flex-col space-y-6';
    case 'square':
      return 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-center';
    default:
      return 'flex flex-col space-y-4';
  }
}
