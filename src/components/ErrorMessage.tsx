import React from 'react';

interface ErrorMessageProps {
  error: string | null;
  className?: string;
}

/**
 * ErrorMessage component
 * 
 * A user-friendly error message component that displays validation errors
 * with appropriate styling and messaging.
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, className = '' }) => {
  if (!error) return null;
  
  // Map error codes to user-friendly messages
  const getFriendlyMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'too_short': 'Your message is too short. Please write at least 5 characters.',
      'too_long': 'Your message is too long. Please keep it under 350 characters.',
      'too_many_line_breaks': 'Too many line breaks. Please use fewer line breaks.',
      'repetitive_content': 'Your message contains too many repeated characters. Please vary your content.',
      'short_line_spam': 'Your message format looks like spam. Please use normal sentences.',
      'rate_limited': 'Please wait a moment before posting again.',
      'spam_detected': 'Your message was flagged as potential spam. Please try again later.',
      'server_error': 'Something went wrong. Please try again later.',
      'default': 'There was a problem with your message. Please try again.'
    };
    
    return errorMessages[errorCode] || errorMessages.default;
  };
  
  // Extract error code if it's in JSON format
  let errorMessage = error;
  try {
    if (error.startsWith('{')) {
      const errorObj = JSON.parse(error);
      errorMessage = getFriendlyMessage(errorObj.error);
    } else {
      errorMessage = getFriendlyMessage(error);
    }
  } catch (e) {
    // If parsing fails, use the original error message
  }
  
  return (
    <div className={`error-message ${className}`} role="alert">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <span>{errorMessage}</span>
    </div>
  );
};

export default ErrorMessage;