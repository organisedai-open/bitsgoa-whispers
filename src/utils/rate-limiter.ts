/**
 * Rate Limiter Utility
 * 
 * This module provides rate limiting functionality using localStorage
 * to persist across page reloads and prevent bypassing cooldowns.
 */

// Storage key prefix for rate limiting
const STORAGE_PREFIX = 'rate_limit_';

// Clean up old entries from localStorage on load
if (typeof window !== 'undefined') {
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_PREFIX)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        // Remove entries older than 5 minutes
        if (data.timestamp && now - data.timestamp > 5 * 60 * 1000) {
          keysToRemove.push(key);
        }
      } catch {
        // Invalid data, remove it
        keysToRemove.push(key);
      }
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Helper functions for localStorage operations
function getStorageKey(sessionId: string, channel: string): string {
  return `${STORAGE_PREFIX}${sessionId}:${channel}`;
}

function getStoredData(key: string): { count: number; timestamp: number } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const data = JSON.parse(stored);
    return {
      count: data.count || 0,
      timestamp: data.timestamp || 0
    };
  } catch {
    return null;
  }
}

function setStoredData(key: string, data: { count: number; timestamp: number }): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    // If localStorage is full, try to clean up old entries
    console.warn('localStorage full, cleaning up old rate limit entries');
    const now = Date.now();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        try {
          const oldData = JSON.parse(localStorage.getItem(k) || '{}');
          if (oldData.timestamp && now - oldData.timestamp > 5 * 60 * 1000) {
            localStorage.removeItem(k);
          }
        } catch {
          localStorage.removeItem(k);
        }
      }
    }
    // Try again
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {
      // If still failing, fall back to in-memory (not ideal but better than crashing)
      console.error('Failed to store rate limit data in localStorage');
    }
  }
}

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
 * Uses localStorage to persist across page reloads
 */
export async function checkRateLimit(
  sessionId: string,
  channel: string,
  options: RateLimitOptions = DEFAULT_OPTIONS
): Promise<RateLimitResult> {
  // Create a unique key for this session and channel
  const storageKey = getStorageKey(sessionId, channel);
  const now = Date.now();
  
  // Get stored data from localStorage
  let entry = getStoredData(storageKey);
  
  if (!entry) {
    // First request from this session for this channel
    entry = {
      count: 1,
      timestamp: now
    };
    setStoredData(storageKey, entry);
    
    return {
      allowed: true,
      remaining: options.maxRequests - 1,
      resetTime: now + options.windowMs
    };
  }
  
  const timeSinceLastRequest = now - entry.timestamp;
  
  // Check if the window has reset
  if (timeSinceLastRequest > options.windowMs) {
    // Reset the counter
    entry = {
      count: 1,
      timestamp: now
    };
    setStoredData(storageKey, entry);
    
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
      entry.count++;
      // Don't update timestamp - keep the original burst window start time
      setStoredData(storageKey, entry);
      
      return {
        allowed: true,
        remaining: options.burstLimit - entry.count,
        resetTime: entry.timestamp + options.burstWindowMs
      };
    }
    
    // If burst limit exceeded, enforce cooldown
    const resetTime = entry.timestamp + options.burstWindowMs;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
      error: "rate_limited",
      message: `Please wait ${Math.ceil((resetTime - now) / 1000)} seconds before posting again.`
    };
  }
  
  // Standard rate limiting
  if (entry.count < options.maxRequests) {
    entry.count++;
    // Don't update timestamp - keep the original window start time
    setStoredData(storageKey, entry);
    
    return {
      allowed: true,
      remaining: options.maxRequests - entry.count,
      resetTime: entry.timestamp + options.windowMs
    };
  }
  
  // Rate limited
  const resetTime = entry.timestamp + options.windowMs;
  return {
    allowed: false,
    remaining: 0,
    resetTime,
    error: "rate_limited",
    message: `Please wait ${Math.ceil((resetTime - now) / 1000)} seconds before posting again.`
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
  if (process.env.NODE_ENV === 'development') {
    console.log({
      type: 'moderation_event',
      timestamp: new Date().toISOString(),
      channel,
      // Truncate text to avoid storing full messages
      text: truncatedText.substring(0, 50) + (truncatedText.length > 50 ? '...' : ''),
      reason,
      sessionId: sessionId.substring(0, 8) // Only store partial session ID
    });
  }
  
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