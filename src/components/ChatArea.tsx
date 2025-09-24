import { useEffect, useRef, useState } from "react";
import { Hash, Heart, MessageCircle } from "lucide-react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  created_at: string;
  reported: boolean;
}

interface ChatAreaProps {
  channel: string;
  username: string;
  sessionId: string;
}

const channelIcons = {
  general: <Hash className="w-5 h-5" />,
  confessions: <MessageCircle className="w-5 h-5" />,
  support: <Heart className="w-5 h-5" />,
};

const channelDescriptions = {
  general: "Campus-wide conversations",
  confessions: "Share your secrets anonymously",
  support: "A safe space for emotional support",
};

export default function ChatArea({ channel, username, sessionId }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${channel}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `channel=eq.${channel}`
        },
        (payload) => {
          const updatedMessage = payload.new as ChatMessage;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    
    const { error } = await supabase
      .from('messages')
      .insert([
        {
          channel,
          username,
          content,
        }
      ]);

    if (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const reportMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('reports')
      .insert([
        {
          message_id: messageId,
          reporter_session: sessionId,
        }
      ]);

    if (error) {
      console.error('Error reporting message:', error);
      toast({
        title: "Failed to report message",
        description: "Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Message reported",
        description: "Thank you for helping keep our community safe.",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      <div className="bg-card border-b border-border p-4">
        <div>
          <h2 className="text-lg font-semibold text-card-foreground capitalize">
            #{channel}
          </h2>
          <p className="text-sm text-muted-foreground">
            {channelDescriptions[channel as keyof typeof channelDescriptions]}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">No messages yet</p>
              <p className="text-sm text-muted-foreground">
                Be the first to share something!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              id={message.id}
              username={message.username}
              content={message.content}
              createdAt={message.created_at}
              reported={message.reported}
              onReport={reportMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput onSendMessage={sendMessage} isLoading={isLoading} />
    </div>
  );
}