import { useEffect, useRef, useState } from "react";
import { Hash, Heart, MessageCircle, Utensils, GraduationCap, Monitor, Building, Users, Globe } from "lucide-react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import ReplyComposer from "./ReplyComposer";
import { db } from "@/integrations/firebase/client";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDocs,
    Timestamp,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useMobileViewport } from "@/hooks/use-mobile-viewport";

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  created_at: string;
  reported: boolean;
  replyToMessageId?: string;
  replyToContent?: string;
  replyToUsername?: string;
}

interface ChatAreaProps {
  channel: string;
  username: string;
  sessionId: string;
}

const channelIcons = {
  // Original channels
  general: <Globe className="w-5 h-5" />,
  confessions: <MessageCircle className="w-5 h-5" />,
  support: <Heart className="w-5 h-5" />,
  // Food outlets
  subspot: <Utensils className="w-5 h-5" />,
  fk: <Utensils className="w-5 h-5" />,
  ins: <Utensils className="w-5 h-5" />,
  gajalaxmi: <Utensils className="w-5 h-5" />,
  foodtruck: <Utensils className="w-5 h-5" />,
  // Lecture halls
  lt1: <GraduationCap className="w-5 h-5" />,
  lt2: <GraduationCap className="w-5 h-5" />,
  lt3: <GraduationCap className="w-5 h-5" />,
  lt4: <GraduationCap className="w-5 h-5" />,
  // Digital lecture halls
  dlt1: <Monitor className="w-5 h-5" />,
  dlt2: <Monitor className="w-5 h-5" />,
  dlt3: <Monitor className="w-5 h-5" />,
  dlt4: <Monitor className="w-5 h-5" />,
  dlt5: <Monitor className="w-5 h-5" />,
  dlt6: <Monitor className="w-5 h-5" />,
  dlt7: <Monitor className="w-5 h-5" />,
  dlt8: <Monitor className="w-5 h-5" />,
  // Campus facilities
  library: <Building className="w-5 h-5" />,
  auditorium: <Building className="w-5 h-5" />,
  sac: <Building className="w-5 h-5" />,
  gym: <Building className="w-5 h-5" />,
  // Mess
  amess: <Users className="w-5 h-5" />,
  cmess: <Users className="w-5 h-5" />,
  dmess: <Users className="w-5 h-5" />,
};

const channelDescriptions = {
  // Original channels
  general: "Campus-wide conversations",
  confessions: "Share your secrets anonymously",
  support: "A safe space for emotional support",
  // Food outlets
  subspot: "Subspot discussions",
  fk: "FK food court",
  ins: "INS canteen",
  gajalaxmi: "Gajalaxmi restaurant",
  foodtruck: "Food truck area",
  // Lecture halls
  lt1: "Lecture Theatre 1",
  lt2: "Lecture Theatre 2",
  lt3: "Lecture Theatre 3",
  lt4: "Lecture Theatre 4",
  // Digital lecture halls
  dlt1: "Digital Lecture Theatre 1",
  dlt2: "Digital Lecture Theatre 2",
  dlt3: "Digital Lecture Theatre 3",
  dlt4: "Digital Lecture Theatre 4",
  dlt5: "Digital Lecture Theatre 5",
  dlt6: "Digital Lecture Theatre 6",
  dlt7: "Digital Lecture Theatre 7",
  dlt8: "Digital Lecture Theatre 8",
  // Campus facilities
  library: "Library discussions",
  auditorium: "Auditorium events",
  sac: "Student Activity Center",
  gym: "Gymnasium discussions",
  // Mess
  amess: "A Mess discussions",
  cmess: "C Mess discussions",
  dmess: "D Mess discussions",
};

// Function to format channel names properly
const formatChannelName = (channelId: string): string => {
  // Handle special cases and acronyms
  const specialCases: { [key: string]: string } = {
    'general': 'General',
    'confessions': 'Confessions', 
    'support': 'Support',
    'subspot': 'Subspot',
    'fk': 'FK',
    'ins': 'INS',
    'gajalaxmi': 'Gajalaxmi',
    'foodtruck': 'Food Truck',
    'lt1': 'LT1',
    'lt2': 'LT2', 
    'lt3': 'LT3',
    'lt4': 'LT4',
    'dlt1': 'DLT1',
    'dlt2': 'DLT2',
    'dlt3': 'DLT3',
    'dlt4': 'DLT4',
    'dlt5': 'DLT5',
    'dlt6': 'DLT6',
    'dlt7': 'DLT7',
    'dlt8': 'DLT8',
    'library': 'Library',
    'auditorium': 'Auditorium',
    'sac': 'SAC',
    'gym': 'Gym',
    'amess': 'A Mess',
    'cmess': 'C Mess',
    'dmess': 'D Mess'
  };

  return specialCases[channelId] || channelId
    .split(/(?=[A-Z])/) // Split on capital letters
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ChatArea({ channel, username, sessionId }: ChatAreaProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<{
    id: string;
    content: string;
    username: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { toast } = useToast();
  const { isMobile, viewportHeight } = useMobileViewport();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "end",
          inline: "nearest"
        });
      });
    }
  };

  const handleReply = (messageId: string, content: string, username: string) => {
    setReplyToMessage({ id: messageId, content, username });
  };

  const handleCancelReply = () => {
    setReplyToMessage(null);
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      // Use requestAnimationFrame for smoother scrolling
      requestAnimationFrame(() => {
        messageElement.scrollIntoView({ 
          behavior: "smooth", 
          block: "center",
          inline: "nearest"
        });
      });
      // Add subtle highlight effect
      messageElement.classList.add("animate-pulse");
      setTimeout(() => {
        messageElement.classList.remove("animate-pulse");
      }, 2000);
    } else {
      toast({
        title: "Original message not found",
        description: "The message you're replying to may have been removed.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Use a query that avoids composite index requirements: filter by channel only
    const q = query(
      collection(db, 'messages'),
      where('channel', '==', channel)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Date.now();
        const items: ChatMessage[] = snapshot.docs
          .map((d) => {
            const data = d.data() as any;
            const created = data.created_at?.toDate
              ? data.created_at.toDate().toISOString()
              : (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString());
            const expireAtMs = data.expire_at?.toDate ? data.expire_at.toDate().getTime() : undefined;
            return {
              id: d.id,
              username: data.username,
              content: data.content,
              created_at: created,
              reported: Boolean(data.reported),
              replyToMessageId: data.replyToMessageId || undefined,
              replyToContent: data.replyToContent || undefined,
              replyToUsername: data.replyToUsername || undefined,
              // pass through, we'll filter below
            } as ChatMessage & { expireAtMs?: number };
          })
          .filter((m: any) => (m.expireAtMs ? m.expireAtMs > now : true))
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setMessages(items);
        scrollToBottom();
      },
      (error) => {
        console.error('Realtime subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [channel]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('channel', '==', channel)
      );
      const snap = await getDocs(q);
      const now = Date.now();
      const items: ChatMessage[] = snap.docs
        .map((d) => {
          const data = d.data() as any;
          const created = data.created_at?.toDate
            ? data.created_at.toDate().toISOString()
            : (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString());
          const expireAtMs = data.expire_at?.toDate ? data.expire_at.toDate().getTime() : undefined;
          return {
            id: d.id,
            username: data.username,
            content: data.content,
            created_at: created,
            reported: Boolean(data.reported),
            replyToMessageId: data.replyToMessageId || undefined,
            replyToContent: data.replyToContent || undefined,
            replyToUsername: data.replyToUsername || undefined,
          } as ChatMessage & { expireAtMs?: number };
        })
        .filter((m: any) => (m.expireAtMs ? m.expireAtMs > now : true))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      setMessages(items);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    
    try {
      const expireAt = Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
      const messageData: any = {
        channel,
        username,
        content,
        created_at: serverTimestamp(),
        expire_at: expireAt,
        reported: false,
        report_count: 0,
      };

      // Add reply data if replying to a message
      if (replyToMessage) {
        messageData.replyToMessageId = replyToMessage.id;
        messageData.replyToContent = replyToMessage.content;
        messageData.replyToUsername = replyToMessage.username;
      }

      await addDoc(collection(db, 'messages'), messageData);
      
      // Clear reply state after sending
      setReplyToMessage(null);
    } catch (error) {
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
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        report_count: increment(1),
      });
      // After increment, optimistically set reported=true if >=2
      // Firestore rule: UI will re-render via onSnapshot, but we can also set it here
      await updateDoc(messageRef, { reported: true });
      toast({
        title: "Message reported",
        description: "Thank you for helping keep our community safe.",
      });
    } catch (error) {
      console.error('Error reporting message:', error);
      toast({
        title: "Failed to report message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };


  return (
    <div className="flex-1 flex flex-col mobile-content lg:flex-col overflow-hidden" style={{ backgroundColor: '#1B1810' }}>
      {/* Slim channel header */}
      <div className="px-4 py-2 border-b border-border relative z-40 mobile-header mobile-safe-top lg:py-3" style={{ backgroundColor: '#2A2620' }}>
        <div className="flex items-baseline justify-between">
          <div className="flex items-center">
            <button 
              className="lg:hidden mr-3 text-white/60 hover:text-white/90"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
              aria-label="Toggle sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div>
              <div className="text-[15px] font-semibold text-white flex items-center">
                {channelIcons[channel as keyof typeof channelIcons] || <Hash className="w-5 h-5" />}
                <span className="ml-2">{formatChannelName(channel)}</span>
              </div>
              <div className="text-[12px] text-white/50">
                {channelDescriptions[channel as keyof typeof channelDescriptions] || "Channel discussion"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-messages flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/50 mb-2">No messages yet</p>
              <p className="text-sm text-white/50">
                Be the first to share something!
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, idx) => {
            const prev = messages[idx - 1];
            const isGrouped = prev && prev.username === message.username && (new Date(message.created_at).getTime() - new Date(prev.created_at).getTime()) < 3 * 60 * 1000;
            return (
              <div 
                key={message.id}
                ref={(el) => (messageRefs.current[message.id] = el)}
              >
                <Message
                  id={message.id}
                  username={message.username}
                  content={message.content}
                  createdAt={message.created_at}
                  reported={message.reported}
                  onReport={reportMessage}
                  onReply={handleReply}
                  onScrollToOriginal={scrollToMessage}
                  isGrouped={Boolean(isGrouped)}
                  replyToMessageId={message.replyToMessageId}
                  replyToContent={message.replyToContent}
                  replyToUsername={message.replyToUsername}
                  isOwnMessage={message.username === username}
                />
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mobile-input-area mobile-safe-bottom overflow-hidden">
        {replyToMessage && (
          <ReplyComposer
            replyToMessage={replyToMessage}
            onCancel={handleCancelReply}
            onScrollToOriginal={scrollToMessage}
          />
        )}
        <MessageInput onSendMessage={sendMessage} isLoading={isLoading} channel={channel} />
      </div>
    </div>
  );
}