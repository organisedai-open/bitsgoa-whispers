/**
 * Input Sanitization Middleware
 * 
 * Provides comprehensive input sanitization and validation
 */

import DOMPurify from 'isomorphic-dompurify';

// Express types for middleware
interface Request {
  body: Record<string, unknown>;
  query: Record<string, unknown>;
}

interface Response {
  status: (code: number) => Response;
  json: (data: Record<string, unknown>) => void;
}

type NextFunction = () => void;

export interface SanitizationOptions {
  maxLength: number;
  allowedTags: string[];
  allowedAttributes: string[];
  stripHtml: boolean;
  normalizeWhitespace: boolean;
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  maxLength: 350,
  allowedTags: [], // No HTML tags allowed
  allowedAttributes: [],
  stripHtml: true,
  normalizeWhitespace: true,
};

/**
 * Sanitize HTML content using DOMPurify
 */
export function sanitizeHtml(input: string, options: SanitizationOptions = DEFAULT_OPTIONS): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Normalize whitespace first
  let sanitized = options.normalizeWhitespace 
    ? input.replace(/\s+/g, ' ').trim()
    : input;

  // Strip HTML if configured
  if (options.stripHtml) {
    sanitized = DOMPurify.sanitize(sanitized, {
      ALLOWED_TAGS: options.allowedTags,
      ALLOWED_ATTR: options.allowedAttributes,
      KEEP_CONTENT: true,
    });
  }

  // Truncate if too long
  if (sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

/**
 * Validate and sanitize message content
 */
export function sanitizeMessage(input: string, options: SanitizationOptions = DEFAULT_OPTIONS): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!input || typeof input !== 'string') {
    return {
      isValid: false,
      sanitized: '',
      error: 'Invalid input type'
    };
  }

  // Check length before sanitization
  if (input.length > options.maxLength) {
    return {
      isValid: false,
      sanitized: '',
      error: `Input exceeds maximum length of ${options.maxLength} characters`
    };
  }

  // Sanitize the input
  const sanitized = sanitizeHtml(input, options);

  // Check if sanitization removed too much content
  if (sanitized.length < input.length * 0.5) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Input contains potentially malicious content'
    };
  }

  return {
    isValid: true,
    sanitized
  };
}

/**
 * Express middleware for input sanitization
 */
export function inputSanitizationMiddleware(options: SanitizationOptions = DEFAULT_OPTIONS) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize common input fields
      const fieldsToSanitize = ['message', 'content', 'username', 'channel'];
      
      for (const field of fieldsToSanitize) {
        if (req.body[field] && typeof req.body[field] === 'string') {
          const result = sanitizeMessage(req.body[field], options);
          
          if (!result.isValid) {
            return res.status(400).json({
              error: 'invalid_input',
              message: result.error
            });
          }
          
          req.body[field] = result.sanitized;
        }
      }

      // Sanitize query parameters
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string') {
          req.query[key] = sanitizeHtml(value as string, options);
        }
      }

      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      res.status(500).json({
        error: 'sanitization_error',
        message: 'An error occurred while processing your input'
      });
    }
  };
}

/**
 * Client-side input sanitization for React components
 */
export function useInputSanitization(options: SanitizationOptions = DEFAULT_OPTIONS) {
  const sanitizeInput = (input: string): string => {
    return sanitizeHtml(input, options);
  };

  const validateInput = (input: string): { isValid: boolean; error?: string } => {
    if (!input || typeof input !== 'string') {
      return { isValid: false, error: 'Invalid input' };
    }

    if (input.length > options.maxLength) {
      return { 
        isValid: false, 
        error: `Input exceeds maximum length of ${options.maxLength} characters` 
      };
    }

    return { isValid: true };
  };

  return { sanitizeInput, validateInput };
}
