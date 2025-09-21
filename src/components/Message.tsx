import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, MoreHorizontal } from "lucide-react";
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
}

export default function Message({ 
  id, 
  username, 
  content, 
  createdAt, 
  reported,
  onReport 
}: MessageProps) {
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  return (
    <div className={cn(
      "bg-card rounded-lg p-4 animate-fade-in transition-all",
      "hover:shadow-lg hover:scale-[1.01]",
      reported && "opacity-50"
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-xs font-bold text-primary-foreground">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-card-foreground">{username}</h4>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => onReport(id)}
              className="text-destructive focus:text-destructive"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Message
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {reported && (
        <div className="mb-2 text-xs text-destructive flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          This message has been reported
        </div>
      )}

      <p className="text-card-foreground whitespace-pre-wrap break-words">
        {content}
      </p>
    </div>
  );
}