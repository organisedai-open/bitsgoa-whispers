/**
 * Unit tests for spam prevention utilities
 */

import { validateMessage } from '../utils/spam-prevention';
import { checkRateLimit } from '../utils/rate-limiter';
import { processMessage } from '../middleware/spamPreventionMiddleware';

describe('Message Validation Tests', () => {
  test('should reject messages that are too short', () => {
    const result = validateMessage('Hi');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('too_short');
  });

  test('should reject messages that are too long', () => {
    // Create a string longer than 350 characters
    const longMessage = 'A'.repeat(351);
    const result = validateMessage(longMessage);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('too_long');
  });

  test('should reject messages with too many line breaks', () => {
    const message = 'Line 1\n\nLine 2\n\nLine 3\n\nLine 4\n\nLine 5\n\nLine 6';
    const result = validateMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('too_many_line_breaks');
  });

  test('should reject messages with excessive repetition', () => {
    const message = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA with some other text';
    const result = validateMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('repetitive_content');
  });

  test('should reject messages with short line spam', () => {
    const message = 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj';
    const result = validateMessage(message);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('short_line_spam');
  });

  test('should normalize whitespace in valid messages', () => {
    const message = '  Hello   world!  \n\n\n  How are you?  ';
    const result = validateMessage(message);
    expect(result.isValid).toBe(true);
    expect(result.message).toBe('Hello world!\n\nHow are you?');
  });

  test('should accept valid messages', () => {
    const message = 'This is a normal message that should pass all validation checks.';
    const result = validateMessage(message);
    expect(result.isValid).toBe(true);
  });
});

describe('Rate Limiting Tests', () => {
  beforeEach(() => {
    // Clear any stored rate limit data between tests
    jest.resetModules();
  });

  test('should allow first message within rate limits', async () => {
    const result = await checkRateLimit('test-session', 'test-channel');
    expect(result.allowed).toBe(true);
  });

  test('should block messages that exceed rate limits', async () => {
    // First message should be allowed
    await checkRateLimit('test-session', 'test-channel');
    
    // Second message within window should be blocked
    const result = await checkRateLimit('test-session', 'test-channel');
    expect(result.allowed).toBe(false);
    expect(result.error).toBe('rate_limited');
  });

  test('should allow burst messages within burst limit', async () => {
    // Configure a test-specific rate limit
    const options = {
      maxRequests: 1,
      windowMs: 30000,
      burstLimit: 3,
      burstWindowMs: 10000
    };

    // First three messages should be allowed (burst)
    await checkRateLimit('burst-session', 'test-channel', options);
    await checkRateLimit('burst-session', 'test-channel', options);
    const thirdResult = await checkRateLimit('burst-session', 'test-channel', options);
    
    expect(thirdResult.allowed).toBe(true);
    
    // Fourth message should be blocked
    const fourthResult = await checkRateLimit('burst-session', 'test-channel', options);
    expect(fourthResult.allowed).toBe(false);
  });
});

describe('Middleware Integration Tests', () => {
  test('should detect honeypot submissions', async () => {
    const result = await processMessage(
      'This is a valid message',
      'test-session',
      'test-channel',
      'bot-input' // Non-empty honeypot value
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('spam_detected');
  });

  test('should process valid messages successfully', async () => {
    const result = await processMessage(
      'This is a valid message',
      'test-session',
      'test-channel',
      '' // Empty honeypot value
    );
    
    expect(result.success).toBe(true);
    expect(result.normalizedContent).toBe('This is a valid message');
  });

  test('should reject invalid messages', async () => {
    const result = await processMessage(
      'hi', // Too short
      'test-session',
      'test-channel',
      ''
    );
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('too_short');
  });
});