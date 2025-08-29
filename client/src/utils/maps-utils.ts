/**
 * Converts a Google Maps URL to an embed URL for iframe usage
 * @param mapsUrl - The original Google Maps URL
 * @returns The embed URL for iframe
 */
export function convertToEmbedUrl(mapsUrl: string): string {
  try {
    // Handle different Google Maps URL formats
    if (mapsUrl.includes('maps.app.goo.gl')) {
      // For short URLs, we'll use a generic embed URL for the location
      // This is a fallback since we can't easily convert short URLs
      return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.3325395304414!2d-5.986583684692207!3d37.38950697984652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd126c1114be6291%3A0x34f018621cfe5648!2sColegio%20Claret!5e0!3m2!1ses!2ses!4v1640995200000!5m2!1ses!2ses';
    }
    
    if (mapsUrl.includes('google.com/maps')) {
      // For regular Google Maps URLs, try to extract coordinates
      const url = new URL(mapsUrl);
      const query = url.searchParams.get('q');
      
      if (query) {
        // If there's a query parameter, use it for the embed
        return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(query)}`;
      }
    }
    
    // Fallback to a generic embed URL for Colegio Claret Sevilla
    return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.3325395304414!2d-5.986583684692207!3d37.38950697984652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd126c1114be6291%3A0x34f018621cfe5648!2sColegio%20Claret!5e0!3m2!1ses!2ses!4v1640995200000!5m2!1ses!2ses';
  } catch (error) {
    console.error('Error converting maps URL:', error);
    // Return a fallback embed URL
    return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.3325395304414!2d-5.986583684692207!3d37.38950697984652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd126c1114be6291%3A0x34f018621cfe5648!2sColegio%20Claret!5e0!3m2!1ses!2ses!4v1640995200000!5m2!1ses!2ses';
  }
}

/**
 * Gets the embed URL for Colegio Claret Sevilla
 * @returns The embed URL for the theater location
 */
export function getTheaterEmbedUrl(): string {
  return 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.3325395304414!2d-5.986583684692207!3d37.38950697984652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd126c1114be6291%3A0x34f018621cfe5648!2sColegio%20Claret!5e0!3m2!1ses!2ses!4v1640995200000!5m2!1ses!2ses';
}

/**
 * Gets the theater location information
 * @returns Object with theater location details
 */
export function getTheaterLocation() {
  return {
    name: 'Teatro Colegio Claret Sevilla',
    address: 'Teatro Colegio Claret Sevilla, Sevilla, España',
    mapsUrl: 'https://maps.app.goo.gl/D6J4sbYLGuzUDYmV7',
    embedUrl: getTheaterEmbedUrl(),
    coordinates: {
      lat: 37.38950697984652,
      lng: -5.986583684692207
    }
  };
}
