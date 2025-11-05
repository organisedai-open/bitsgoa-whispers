import { X, CornerUpLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReplyComposerProps {
  replyToMessage: {
    id: string;
    content: string;
    username: string;
  };
  onCancel: () => void;
  onScrollToOriginal?: (messageId: string) => void;
}

export default function ReplyComposer({ 
  replyToMessage, 
  onCancel, 
  onScrollToOriginal 
}: ReplyComposerProps) {
  const truncatedContent = replyToMessage.content.length > 80 
    ? replyToMessage.content.substring(0, 80) + "..." 
    : replyToMessage.content;

  return (
    <div className="reply-preview p-3 mx-4 mb-2 shadow-sm slide-in">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">
          <CornerUpLeft className="w-4 h-4 text-[#44BBA4]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-[#A0A0A0]">{replyToMessage.username}</span>
            <span className="text-xs text-[#A0A0A0]">•</span>
            <span className="text-xs text-[#A0A0A0]">Replying to</span>
          </div>
          <p 
            className="text-sm text-[#EDEDED] cursor-pointer hover:bg-[#3A3A34] rounded px-1 -mx-1 transition-colors"
            onClick={() => onScrollToOriginal?.(replyToMessage.id)}
          >
            {truncatedContent}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-6 w-6 text-[#CFCFA8] hover:text-[#FDFFFC] flex-shrink-0 hover-glow button-hover scale-in"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
