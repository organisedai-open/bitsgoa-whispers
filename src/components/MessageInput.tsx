import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
}

const profanityList = [
  "fuck", "shit", "damn", "bitch", "ass", "hell", 
  // Add more as needed, being mindful of context
];

function containsProfanity(text: string): boolean {
  const lowerText = text.toLowerCase();
  return profanityList.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(lowerText);
  });
}

export default function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    if (message.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep messages under 500 characters.",
        variant: "destructive",
      });
      return;
    }
    
    if (containsProfanity(message)) {
      toast({
        title: "Message blocked",
        description: "Please keep the conversation respectful.",
        variant: "destructive",
      });
      return;
    }
    
    onSendMessage(message);
    setMessage("");
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 border-t border-border bg-card">
      <div className="flex gap-2 items-end">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Share anonymously..."
          className="resize-none min-h-[40px] h-[40px] bg-input border-border text-foreground placeholder:text-muted-foreground py-2"
          maxLength={500}
          disabled={isLoading}
          style={{ height: 'auto' }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || isLoading}
          className="bg-primary text-primary-foreground hover:opacity-90 transition-opacity h-10 w-10"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
      {message.length > 400 && (
        <div className="mt-1 text-xs text-muted-foreground">
          {message.length}/500 characters
        </div>
      )}
    </form>
  );
}