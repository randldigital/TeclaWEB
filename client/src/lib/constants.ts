export const CLARET_COLORS = {
  yellow: '#FFD200',
  yellowDark: '#E6BD00',
  blue: '#1F4AA8',
  navy: '#15367A',
  red: '#C8102E',
} as const;

export const DEFAULT_BASE_PRICE = 5.0;

export const ROLES = {
  ADMIN: 'ADMIN',
  MONITOR: 'MONITOR',
  USER: 'USER',
} as const;

export const POST_STATUS = {
  PUBLISHED: 'PUBLISHED',
  DRAFT: 'DRAFT',
  HIDDEN: 'HIDDEN',
} as const;

export const GALLERY_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  PRIVATE: 'PRIVATE',
} as const;
