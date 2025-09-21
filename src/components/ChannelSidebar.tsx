import { Hash, Heart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const channels: Channel[] = [
  {
    id: "general",
    name: "General",
    icon: <Hash className="w-4 h-4" />,
    description: "Campus-wide conversations",
  },
  {
    id: "confessions",
    name: "Confessions",
    icon: <MessageCircle className="w-4 h-4" />,
    description: "Anonymous secrets & thoughts",
  },
  {
    id: "support",
    name: "Support",
    icon: <Heart className="w-4 h-4" />,
    description: "Emotional support & advice",
  },
];

interface ChannelSidebarProps {
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
}

export default function ChannelSidebar({ selectedChannel, onChannelSelect }: ChannelSidebarProps) {
  return (
    <div className="w-72 bg-sidebar border-r border-sidebar-border h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold text-sidebar-foreground">BITS Whispers</h1>
        <p className="text-sm text-muted-foreground mt-1">Anonymous & Ephemeral</p>
      </div>

      <div className="flex-1 p-4">
        <div className="space-y-2">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => onChannelSelect(channel.id)}
              className={cn(
                "w-full text-left p-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent group",
                selectedChannel === channel.id && "bg-sidebar-accent shadow-sm"
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-md transition-colors",
                  selectedChannel === channel.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-sidebar-accent text-muted-foreground group-hover:text-sidebar-foreground"
                )}>
                  {channel.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-sidebar-foreground">
                    {channel.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {channel.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            Messages auto-delete after 24 hours. No personal data is stored.
          </p>
        </div>
      </div>
    </div>
  );
}