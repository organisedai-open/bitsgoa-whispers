import { useState, useEffect } from "react";
import { Send, Plus, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { validateMessage } from "../utils/spam-prevention";
import DOMPurify from "isomorphic-dompurify";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  channel?: string;
}

// Simple client-side rate limiting
interface RateLimitState {
  lastSubmitTime: number;
  submissionCount: number;
  cooldownUntil: number;
}

const MAX_SUBMISSIONS = 3; // Allow 3 messages in burst
const COOLDOWN_PERIOD = 30000; // 30 seconds cooldown after burst
const BURST_WINDOW = 120000; // 2 minute window for burst messages

export default function MessageInput({ onSendMessage, isLoading, channel = "general" }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    lastSubmitTime: 0,
    submissionCount: 0,
    cooldownUntil: 0
  });
  const { toast } = useToast();

  // Clear error when message changes
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [message]);

  // Check if user is in cooldown period
  const isInCooldown = () => {
    const now = Date.now();
    return now < rateLimit.cooldownUntil;
  };

  // Get remaining cooldown time in seconds
  const getRemainingCooldown = () => {
    const now = Date.now();
    const remaining = Math.ceil((rateLimit.cooldownUntil - now) / 1000);
    return remaining > 0 ? remaining : 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;
    
    // Sanitize input to prevent XSS
    const sanitizedMessage = DOMPurify.sanitize(trimmedMessage, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
    });
    
    if (!sanitizedMessage) {
      setError("Message contains invalid content");
      toast({
        title: "Invalid message",
        description: "Message contains invalid content",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is in cooldown
    if (isInCooldown()) {
      const remainingSeconds = getRemainingCooldown();
      setError(`Please wait ${remainingSeconds} seconds before posting again.`);
      toast({
        title: "Rate limit exceeded",
        description: `Please wait ${remainingSeconds} seconds before posting again.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate message using spam prevention utility
    const validationResult = validateMessage(sanitizedMessage);
    if (!validationResult.isValid) {
      setError(validationResult.message || "Invalid message");
      toast({
        title: "Message rejected",
        description: validationResult.message,
        variant: "destructive",
      });
      return;
    }
    
    // Update rate limiting
    const now = Date.now();
    const newRateLimit = { ...rateLimit };
    
    // If it's been more than 2 minutes since last submission, reset counter
    if (now - rateLimit.lastSubmitTime > BURST_WINDOW) {
      newRateLimit.submissionCount = 1;
    } else {
      newRateLimit.submissionCount += 1;
    }
    
    newRateLimit.lastSubmitTime = now;
    
    // If user has exceeded burst limit, set cooldown
    if (newRateLimit.submissionCount > MAX_SUBMISSIONS) {
      newRateLimit.cooldownUntil = now + COOLDOWN_PERIOD;
      newRateLimit.submissionCount = 0;
    }
    
    setRateLimit(newRateLimit);
    
    // Send the normalized message
    onSendMessage(validationResult.message as string);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-border overflow-hidden" style={{ backgroundColor: '#2A2620' }}>
      <div className="flex gap-3 items-center w-full">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as React.FormEvent);
            }
          }}
          placeholder="Share your thoughts anonymously..."
          className="no-scrollbar resize-none min-h-[44px] border border-white/10 text-white placeholder:text-white/50 px-3 py-3 rounded-lg shadow-inner break-words overflow-wrap-anywhere text-base flex-1 min-w-0 focus:border-[#D97B2D] focus:ring-2 focus:ring-[#D97B2D]/20"
          style={{ backgroundColor: '#2A2620' }}
          maxLength={350} // Updated to match spam prevention limit
          disabled={isLoading || isInCooldown()}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading || isInCooldown()}
          className="bg-[#D97B2D] text-white hover:bg-[#B36224] transition-all duration-300 h-11 w-11 rounded-full flex-shrink-0 button-hover hover:scale-110"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Only show cooldown message when active */}
      {isInCooldown() && (
        <div className="mt-2 text-center">
          <span className="text-xs text-destructive">
            Cooldown: {getRemainingCooldown()}s
          </span>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-destructive">
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
    </form>
  );
}