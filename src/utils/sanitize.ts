import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitizes text content by stripping all HTML tags
 * @param text - Text that may contain HTML
 * @returns Plain text with HTML tags removed
 */
export const sanitizeText = (text: string): string => {
  return DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [] 
  });
};

/**
 * Sanitizes rich text content allowing safe formatting
 * @param richText - Rich text content that may contain HTML
 * @returns Sanitized rich text safe for rendering
 */
export const sanitizeRichText = (richText: string): string => {
  return DOMPurify.sanitize(richText, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'b', 'i', 'u',
      'ul', 'ol', 'li', 'blockquote',
      'a', 'img'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'src', 'alt', 'title',
      'width', 'height', 'style'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|ftp):\/\/|mailto:|tel:|#)/i,
  });
};

/**
 * Validates and sanitizes form input data
 * @param data - Object containing form field values
 * @returns Sanitized form data object
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(data: T): T => {
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    if (typeof value === 'string') {
      // Sanitize string values by removing HTML tags
      (sanitized as any)[key] = sanitizeText(value);
    }
  });
  
  return sanitized;
};