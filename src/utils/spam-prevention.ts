/**
 * Spam Prevention Utility
 * 
 * This module provides functions for validating messages and preventing spam
 * in an anonymous chat application.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  message?: string;
}

export interface MessageValidationOptions {
  minLength?: number;
  maxLength?: number;
  maxLineBreaks?: number;
  maxRepetitionPercentage?: number;
  minLinesLength?: number;
}

const DEFAULT_OPTIONS: MessageValidationOptions = {
  minLength: 5,
  maxLength: 350,
  maxLineBreaks: 5,
  maxRepetitionPercentage: 70,
  minLinesLength: 2, // Minimum average characters per line to prevent short-line spam
};

/**
 * Normalizes whitespace in a message
 * - Trims leading/trailing whitespace
 * - Collapses multiple empty lines into one
 */
export function normalizeMessage(message: string): string {
  // Trim the message
  let normalized = message.trim();
  
  // Replace multiple consecutive line breaks with a single line break
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  
  return normalized;
}

/**
 * Checks if a message contains excessive repetition of a single character
 */
export function checkRepetition(message: string, threshold: number = 70): ValidationResult {
  if (!message) return { isValid: false, error: "empty_message", message: "Message cannot be empty." };
  
  const charCounts: Record<string, number> = {};
  let totalChars = 0;
  
  // Count each character (ignoring whitespace)
  for (const char of message) {
    if (!/\s/.test(char)) {
      charCounts[char] = (charCounts[char] || 0) + 1;
      totalChars++;
    }
  }
  
  // Find the most repeated character
  let maxChar = '';
  let maxCount = 0;
  
  for (const char in charCounts) {
    if (charCounts[char] > maxCount) {
      maxChar = char;
      maxCount = charCounts[char];
    }
  }
  
  // Calculate percentage
  const repetitionPercentage = (maxCount / totalChars) * 100;
  
  if (repetitionPercentage > threshold) {
    return {
      isValid: false,
      error: "excessive_repetition",
      message: "Your message contains too much repetition. Please vary your content."
    };
  }
  
  return { isValid: true };
}

/**
 * Checks if a message has too many short lines (spam pattern)
 */
export function checkShortLineSpam(message: string, minAvgLength: number = 2): ValidationResult {
  const lines = message.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length <= 1) return { isValid: true };
  
  // Calculate average line length
  const totalChars = lines.reduce((sum, line) => sum + line.trim().length, 0);
  const avgLineLength = totalChars / lines.length;
  
  if (avgLineLength < minAvgLength && lines.length > 3) {
    return {
      isValid: false,
      error: "short_line_spam",
      message: "Your message contains too many short lines. Please use normal formatting."
    };
  }
  
  return { isValid: true };
}

/**
 * Validates a message against all spam criteria
 */
export function validateMessage(
  message: string, 
  options: MessageValidationOptions = DEFAULT_OPTIONS
): ValidationResult {
  // Normalize the message first
  const normalizedMessage = normalizeMessage(message);
  
  // Check minimum length
  if (normalizedMessage.length < (options.minLength || DEFAULT_OPTIONS.minLength!)) {
    return {
      isValid: false,
      error: "too_short",
      message: `Message must be at least ${options.minLength || DEFAULT_OPTIONS.minLength} characters.`
    };
  }
  
  // Check maximum length
  if (normalizedMessage.length > (options.maxLength || DEFAULT_OPTIONS.maxLength!)) {
    return {
      isValid: false,
      error: "too_long",
      message: `Message cannot exceed ${options.maxLength || DEFAULT_OPTIONS.maxLength} characters.`
    };
  }
  
  // Check line breaks
  const lineBreakCount = (normalizedMessage.match(/\n/g) || []).length;
  if (lineBreakCount > (options.maxLineBreaks || DEFAULT_OPTIONS.maxLineBreaks!)) {
    return {
      isValid: false,
      error: "too_many_line_breaks",
      message: `Message cannot contain more than ${options.maxLineBreaks || DEFAULT_OPTIONS.maxLineBreaks} line breaks.`
    };
  }
  
  // Check repetition
  const repetitionResult = checkRepetition(
    normalizedMessage, 
    options.maxRepetitionPercentage || DEFAULT_OPTIONS.maxRepetitionPercentage
  );
  if (!repetitionResult.isValid) return repetitionResult;
  
  // Check short line spam
  const shortLineResult = checkShortLineSpam(
    normalizedMessage, 
    options.minLinesLength || DEFAULT_OPTIONS.minLinesLength
  );
  if (!shortLineResult.isValid) return shortLineResult;
  
  return {
    isValid: true,
    message: normalizedMessage // Return the normalized message
  };
}