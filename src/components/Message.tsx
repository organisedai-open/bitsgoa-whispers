import { format, formatDistanceToNow } from "date-fns";
import { AlertTriangle, MoreHorizontal, CornerUpLeft, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface MessageProps {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  reported?: boolean;
  onReport: (messageId: string) => void;
  onReply?: (messageId: string, content: string, username: string) => void;
  onScrollToOriginal?: (messageId: string) => void;
  isGrouped?: boolean;
  replyToMessageId?: string;
  replyToContent?: string;
  replyToUsername?: string;
  isOwnMessage?: boolean;
}

// Generate consistent avatar color based on username
const getAvatarColor = (username: string): string => {
  const colors = ['avatar-green', 'avatar-blue', 'avatar-coral', 'avatar-purple'];
  const hash = username.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

export default function Message({ 
  id, 
  username, 
  content, 
  createdAt, 
  reported,
  onReport,
  onReply,
  onScrollToOriginal,
  isGrouped = false,
  replyToMessageId,
  replyToContent,
  replyToUsername,
  isOwnMessage = false,
}: MessageProps) {
  const timeText = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const avatarColor = getAvatarColor(username);

  return (
    <div className="group/message px-2 fade-in">
      <div className={cn("flex gap-3", isGrouped ? "mt-1" : "mt-4")}> 
        {/* Avatar */}
        <div className={cn("flex-shrink-0", isGrouped ? "invisible" : "visible")}> 
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center hover-glow transition-all scale-in", avatarColor)}>
            <span className="text-xs font-bold text-white">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {!isGrouped && (
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-sm font-semibold text-foreground header-font">{username}</span>
              <span className="text-[11px] text-muted-foreground">{timeText}</span>
            </div>
          )}
          
          {/* Reply preview - above message body */}
          {replyToMessageId && replyToContent && (
            <div className="w-full mb-3">
              <div 
                className="reply-preview p-3 hover:bg-[#2A2A24] transition-colors cursor-pointer group"
                onClick={() => onScrollToOriginal?.(replyToMessageId)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-[#A0A0A0]">{replyToUsername || 'Anonymous'}</span>
                  <span className="text-xs text-[#A0A0A0]">•</span>
                  <span className="text-xs text-[#A0A0A0]">Replying to</span>
                </div>
                <p className="text-sm text-[#EDEDED] line-clamp-1 sm:line-clamp-2 break-words overflow-wrap-anywhere">
                  {replyToContent.length > 80 ? replyToContent.substring(0, 80) + "..." : replyToContent}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <div className={cn(
              "message-bubble p-3",
              isOwnMessage ? "message-bubble-self" : "message-bubble-other"
            )}>
              <p className="text-[14px] leading-6 text-foreground whitespace-pre-wrap break-words overflow-wrap-anywhere">
                {content}
              </p>
            </div>
            
            {/* Hover actions - always visible on mobile */}
            <div className="opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 transition-all duration-300 flex gap-1 flex-shrink-0">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover-glow button-hover slide-in" 
                title="Reply"
                onClick={() => onReply?.(id, content, username)}
              >
                <CornerUpLeft className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover-glow button-hover slide-in">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onReport(id)} className="text-destructive focus:text-destructive">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Report Message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}