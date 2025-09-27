import React, { useState, useEffect } from 'react';
import { validateMessage } from '../utils/spam-prevention';

interface SpamPreventionFormProps {
  onSubmit: (message: string) => Promise<void>;
  channel: string;
  className?: string;
}

/**
 * SpamPreventionForm component
 * 
 * A form component that implements client-side spam prevention features:
 * - Message length validation
 * - Line break limits
 * - Repetition detection
 * - Honeypot field
 * - User-friendly error messages
 */
const SpamPreventionForm: React.FC<SpamPreventionFormProps> = ({ 
  onSubmit, 
  channel,
  className = ''
}) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  
  // Clear error when message changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [message]);

  const validateClientSide = (text: string): { isValid: boolean; message?: string } => {
    // Use the same validation logic as the backend
    const result = validateMessage(text);
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent rapid submissions (simple client-side rate limiting)
    const now = Date.now();
    if (now - lastSubmitTime < 2000) {
      setError('Please wait a moment before submitting again.');
      return;
    }
    
    // Client-side validation
    const validationResult = validateClientSide(message);
    if (!validationResult.isValid) {
      setError(validationResult.message || 'Invalid message');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await onSubmit(message);
      setMessage('');
      setLastSubmitTime(Date.now());
    } catch (err: any) {
      // Handle server-side rejection
      setError(err.message || 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`spam-prevention-form ${className}`}>
      {/* Message input */}
      <div className="message-input-container">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={isSubmitting}
          className="message-input"
          rows={3}
          maxLength={350}
        />
        
        <div className="message-input-footer">
          <span className="character-count">
            {message.length}/350 characters
          </span>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {/* Honeypot field - hidden from users but visible to bots */}
      <div style={{ opacity: 0, position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      
      {/* Submit button */}
      <button 
        type="submit" 
        disabled={isSubmitting || message.trim().length < 5}
        className="submit-button"
      >
        {isSubmitting ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};

export default SpamPreventionForm;