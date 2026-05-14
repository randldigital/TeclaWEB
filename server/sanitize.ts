/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param content - The content to sanitize
 * @returns Sanitized content
 */
export function sanitizeHtml(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Remove all HTML tags and decode entities
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '') // Remove object tags
    .replace(/<embed\b[^<]*>/gi, '') // Remove embed tags
    .replace(/<link\b[^<]*>/gi, '') // Remove link tags
    .replace(/<meta\b[^<]*>/gi, '') // Remove meta tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: URLs
    .replace(/data:text\/html/gi, '') // Remove data: URLs
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Sanitizes plain text content
 * @param content - The content to sanitize
 * @returns Sanitized plain text
 */
export function sanitizeText(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Remove HTML tags and decode entities
  return content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();
}

/**
 * Sanitizes an object with string properties
 * @param obj - Object to sanitize
 * @param htmlFields - Fields that should be sanitized as HTML
 * @param textFields - Fields that should be sanitized as plain text
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  htmlFields: (keyof T)[] = [],
  textFields: (keyof T)[] = []
): T {
  const sanitized = { ...obj };
  
  // Sanitize HTML fields
  htmlFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeHtml(sanitized[field] as string) as T[keyof T];
    }
  });
  
  // Sanitize text fields
  textFields.forEach(field => {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field] as string) as T[keyof T];
    }
  });
  
  return sanitized;
}
