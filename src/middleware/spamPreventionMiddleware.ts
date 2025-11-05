/**
 * Spam Prevention Middleware
 * 
 * This middleware handles message validation, rate limiting, and honeypot checks
 * for preventing spam in an anonymous chat application.
 */

import { validateMessage } from '../utils/spam-prevention';
import { checkRateLimit, logModerationEvent } from '../utils/rate-limiter';

export interface SpamPreventionOptions {
  minLength?: number;
  maxLength?: number;
  maxLineBreaks?: number;
  maxRepetitionPercentage?: number;
  minLinesLength?: number;
  honeypotFieldName?: string;
  rateLimit?: {
    maxRequests?: number;
    windowMs?: number;
    burstLimit?: number;
    burstWindowMs?: number;
  };
}

const DEFAULT_OPTIONS: SpamPreventionOptions = {
  minLength: 5,
  maxLength: 350,
  maxLineBreaks: 5,
  maxRepetitionPercentage: 70,
  minLinesLength: 2,
  honeypotFieldName: 'website', // Common honeypot field name
  rateLimit: {
    maxRequests: 1,
    windowMs: 30000,
    burstLimit: 3,
    burstWindowMs: 120000,
  }
};

/**
 * Process a message through spam prevention checks
 * 
 * @param message The message content to validate
 * @param sessionId Ephemeral session ID for rate limiting
 * @param channel The channel where the message is being posted
 * @param honeypotValue Value from the honeypot field (should be empty)
 * @param options Configuration options
 * @returns Result object with success status and error details if applicable
 */
export async function processMessage(
  message: string,
  sessionId: string,
  channel: string,
  honeypotValue: string = '',
  options: SpamPreventionOptions = DEFAULT_OPTIONS
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  normalizedContent?: string;
}> {
  // 1. Check honeypot field
  if (honeypotValue && honeypotValue.trim() !== '') {
    logModerationEvent(
      channel,
      message.substring(0, 30),
      'honeypot_triggered',
      sessionId
    );
    
    return {
      success: false,
      error: 'spam_detected',
      message: 'Your message was flagged as potential spam. Please try again later.'
    };
  }
  
  // 2. Validate message content
  const validationResult = validateMessage(message, {
    minLength: options.minLength,
    maxLength: options.maxLength,
    maxLineBreaks: options.maxLineBreaks,
    maxRepetitionPercentage: options.maxRepetitionPercentage,
    minLinesLength: options.minLinesLength
  });
  
  if (!validationResult.isValid) {
    logModerationEvent(
      channel,
      message.substring(0, 30),
      validationResult.error || 'validation_failed',
      sessionId
    );
    
    return {
      success: false,
      error: validationResult.error,
      message: validationResult.message
    };
  }
  
  // 3. Check rate limits
  const rateLimitResult = await checkRateLimit(
    sessionId,
    channel,
    {
      maxRequests: options.rateLimit?.maxRequests || DEFAULT_OPTIONS.rateLimit!.maxRequests!,
      windowMs: options.rateLimit?.windowMs || DEFAULT_OPTIONS.rateLimit!.windowMs!,
      burstLimit: options.rateLimit?.burstLimit || DEFAULT_OPTIONS.rateLimit!.burstLimit!,
      burstWindowMs: options.rateLimit?.burstWindowMs || DEFAULT_OPTIONS.rateLimit!.burstWindowMs!
    }
  );
  
  if (!rateLimitResult.allowed) {
    logModerationEvent(
      channel,
      message.substring(0, 30),
      'rate_limited',
      sessionId
    );
    
    return {
      success: false,
      error: rateLimitResult.error,
      message: rateLimitResult.message
    };
  }
  
  // All checks passed
  return {
    success: true,
    normalizedContent: validationResult.message as string
  };
}

/**
 * Express middleware for spam prevention
 * 
 * Example usage:
 * ```
 * app.post('/api/messages', spamPreventionMiddleware(), async (req, res) => {
 *   // Handle valid message
 *   const { normalizedContent } = req.body;
 *   // Save message to database
 * });
 * ```
 */
export function spamPreventionMiddleware(options: SpamPreventionOptions = DEFAULT_OPTIONS) {
  return async (req: any, res: any, next: any) => {
    try {
      const { message, channel } = req.body;
      const sessionId = req.headers['x-session-id'] || req.cookies?.sessionId || 'anonymous';
      const honeypotValue = req.body[options.honeypotFieldName || DEFAULT_OPTIONS.honeypotFieldName!] || '';
      
      const result = await processMessage(
        message,
        sessionId,
        channel,
        honeypotValue,
        options
      );
      
      if (!result.success) {
        return res.status(400).json({
          error: result.error,
          message: result.message
        });
      }
      
      // Add normalized content to request body
      req.body.normalizedContent = result.normalizedContent;
      next();
    } catch (error) {
      console.error('Spam prevention middleware error:', error);
      res.status(500).json({
        error: 'server_error',
        message: 'An error occurred while processing your message.'
      });
    }
  };
}