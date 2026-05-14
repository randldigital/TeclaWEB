import { useState, useEffect } from 'react';

export type ImageOrientation = 'landscape' | 'portrait' | 'square';

export interface ImageMetadata {
  width: number;
  height: number;
  orientation: ImageOrientation;
  aspectRatio: number;
}

/**
 * Hook to detect image orientation on the client side
 * @param imageUrl - URL of the image to analyze
 * @returns ImageMetadata | null
 */
export function useImageOrientation(imageUrl: string | null): ImageMetadata | null {
  const [metadata, setMetadata] = useState<ImageMetadata | null>(null);

  useEffect(() => {
    if (!imageUrl) {
      setMetadata(null);
      return;
    }

    const detectOrientation = async () => {
      try {
        const img = new Image();
        
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          
          let orientation: ImageOrientation;
          if (aspectRatio > 1.2) {
            orientation = 'landscape';
          } else if (aspectRatio < 0.8) {
            orientation = 'portrait';
          } else {
            orientation = 'square';
          }
          
          setMetadata({
            width: img.naturalWidth,
            height: img.naturalHeight,
            orientation,
            aspectRatio
          });
        };
        
        img.onerror = () => {
          console.warn('Failed to load image for orientation detection:', imageUrl);
          setMetadata(null);
        };
        
        img.src = imageUrl;
      } catch (error) {
        console.error('Error detecting image orientation:', error);
        setMetadata(null);
      }
    };

    detectOrientation();
  }, [imageUrl]);

  return metadata;
}

/**
 * Get CSS classes for orientation-based layout
 * @param orientation - Image orientation
 * @param screenSize - Screen size breakpoint
 * @returns CSS classes string
 */
export function getLayoutClasses(
  orientation: ImageOrientation, 
  screenSize: 'mobile' | 'tablet' | 'desktop' = 'desktop'
): string {
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

/**
 * Get responsive layout classes based on screen size
 * @param orientation - Image orientation
 * @returns Object with responsive classes
 */
export function getResponsiveLayoutClasses(orientation: ImageOrientation) {
  return {
    mobile: 'flex flex-col space-y-4',
    tablet: orientation === 'landscape' 
      ? 'grid grid-cols-1 md:grid-cols-2 gap-6 items-start'
      : 'flex flex-col space-y-6',
    desktop: orientation === 'landscape'
      ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'
      : orientation === 'portrait'
      ? 'flex flex-col space-y-8'
      : 'grid grid-cols-1 xl:grid-cols-2 gap-8 items-center'
  };
}
