/**
 * Rate Limiter Utility
 * 
 * This module provides rate limiting functionality with memory fallback
 * when Redis is not available.
 */

// In-memory store for rate limiting (fallback when Redis is not available)
const memoryStore: Record<string, { count: number, timestamp: number }> = {};

// Clean up old entries from memory store every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(memoryStore).forEach(key => {
    // Remove entries older than 5 minutes
    if (now - memoryStore[key].timestamp > 5 * 60 * 1000) {
      delete memoryStore[key];
    }
  });
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
  message?: string;
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  burstLimit?: number;
  burstWindowMs?: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 1,    // 1 message per window
  windowMs: 30000,   // 30 seconds
  burstLimit: 3,     // Allow 3 messages in burst window
  burstWindowMs: 120000, // 2 minutes
};

/**
 * Check if a request is rate limited
 * Uses in-memory fallback if Redis is not available
 */
export async function checkRateLimit(
  sessionId: string,
  channel: string,
  options: RateLimitOptions = DEFAULT_OPTIONS
): Promise<RateLimitResult> {
  // Create a unique key for this session and channel
  const key = `rate:${sessionId}:${channel}`;
  const now = Date.now();
  
  // Use in-memory store as fallback
  // In a production environment, this would use Redis
  
  if (!memoryStore[key]) {
    // First request from this session for this channel
    memoryStore[key] = {
      count: 1,
      timestamp: now
    };
    
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs
    };
  }
  
  const entry = memoryStore[key];
  const timeSinceLastRequest = now - entry.timestamp;
  
  // Check if the window has reset
  if (timeSinceLastRequest > options.windowMs) {
    // Reset the counter
    memoryStore[key] = {
      count: 1,
      timestamp: now
    };
    
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs
    };
  }
  
  // Check burst limit
  if (options.burstLimit && options.burstWindowMs) {
    // If within burst window and under burst limit, allow
    if (entry.count < options.burstLimit) {
      memoryStore[key].count++;
      
      return {
        allowed: true,
        remaining: options.burstLimit - entry.count,
        resetTime: entry.timestamp + options.burstWindowMs
      };
    }
    
    // If burst limit exceeded, enforce cooldown
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.timestamp + options.burstWindowMs,
      error: "rate_limited",
      message: `Please wait ${Math.ceil((entry.timestamp + options.burstWindowMs - now) / 1000)} seconds before posting again.`
    };
  }
  
  // Standard rate limiting
  if (entry.count < options.maxRequests) {
    memoryStore[key].count++;
    
    return {
      allowed: true,
      remaining: options.maxRequests - entry.count,
      resetTime: entry.timestamp + options.windowMs
    };
  }
  
  // Rate limited
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.timestamp + options.windowMs,
    error: "rate_limited",
    message: `Please wait ${Math.ceil((entry.timestamp + options.windowMs - now) / 1000)} seconds before posting again.`
  };
}

/**
 * Log a moderation event
 * In production, this would write to a database with TTL or emit a webhook
 */
export function logModerationEvent(
  channel: string,
  truncatedText: string,
  reason: string,
  sessionId: string
): void {
  // For development, just log to console
  console.log({
    type: 'moderation_event',
    timestamp: new Date().toISOString(),
    channel,
    // Truncate text to avoid storing full messages
    text: truncatedText.substring(0, 50) + (truncatedText.length > 50 ? '...' : ''),
    reason,
    sessionId: sessionId.substring(0, 8) // Only store partial session ID
  });
  
  // In production, you would:
  // 1. Write to a database table with TTL (e.g., 7 days)
  // 2. Or emit a webhook to an external service
  // 3. Ensure minimal data retention
  
  /* Example with Redis:
  
  await redis.setex(
    `moderation:${Date.now()}:${Math.random().toString(36).substring(2, 10)}`,
    7 * 24 * 60 * 60, // 7 days TTL
    JSON.stringify({
      timestamp: Date.now(),
      channel,
      text: truncatedText.substring(0, 50) + (truncatedText.length > 50 ? '...' : ''),
      reason,
      sessionId: sessionId.substring(0, 8)
    })
  );
  
  */
}