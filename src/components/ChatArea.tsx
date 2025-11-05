import { useEffect, useRef, useState } from "react";
import { Hash, Heart, MessageCircle, Utensils, GraduationCap, Monitor, Building, Users, Globe } from "lucide-react";
import Message from "./Message";
import MessageInput from "./MessageInput";
import ReplyComposer from "./ReplyComposer";
import { getFirestoreForChannel, getAuthForChannel, verifySupportChannelIsolation } from "@/integrations/firebase/client";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  getDocsFromCache,
  getDocsFromServer,
  Timestamp,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  onSnapshot,
  startAt,
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
  const [hasMore, setHasMore] = useState<boolean>(true); // For Load More
  const [oldestDoc, setOldestDoc] = useState<any>(null); // Firestore doc snapshot
  // (Temporary counter removed for production)
  // For decoupled real-time: timestamp when we mounted/current channel
  const liveSinceRef = useRef<Timestamp | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { toast } = useToast();
  const { isMobile, viewportHeight } = useMobileViewport();

  // Load More functionality
  const messageListRef = useRef<HTMLDivElement>(null);
  const [showLoadMore, setShowLoadMore] = useState(false);
  // Prevent auto-scroll when we're prepending older messages
  const skipAutoScrollRef = useRef<boolean>(false);
  // Track whether the next onSnapshot emission is the initial load
  const isInitialSnapshotRef = useRef<boolean>(true);

  // Scroll event: show Load More only when scrolled to top
  useEffect(() => {
    const ref = messageListRef.current;
    if (!ref) return;
    const handleScroll = () => {
      if (ref.scrollTop === 0 && hasMore && messages.length > 0) {
        setShowLoadMore(true);
      } else {
        setShowLoadMore(false);
      }
    };
    ref.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial
    return () => ref.removeEventListener("scroll", handleScroll);
  }, [hasMore, messages]);

  // Handler for Load More button
  const handleLoadMore = async () => {
    if (!oldestDoc) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Load More: oldestDoc is null, cannot load more');
      }
      return;
    }
    setIsLoading(true);
    skipAutoScrollRef.current = true;
    
    // Get the correct Firestore and Auth instances for this channel
    const channelDb = getFirestoreForChannel(channel);
    const channelAuth = getAuthForChannel(channel);
    
    // Ensure anonymous auth is ready
    if (!channelAuth.currentUser) {
      await signInAnonymously(channelAuth);
    }
    
    try {
      // Verify oldestDoc is a valid document snapshot
      if (!oldestDoc || !oldestDoc.id) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Invalid oldestDoc:', oldestDoc);
        }
        toast({
          title: "Cannot load more",
          description: "Invalid pagination state. Please refresh.",
          variant: "destructive",
        });
        setHasMore(false);
        setIsLoading(false);
        skipAutoScrollRef.current = false;
        return;
      }
      
      // Get the correct Firestore instance for this channel
      const channelDb = getFirestoreForChannel(channel);
      const q = query(
        collection(channelDb, "messages"),
        where("channel", "==", channel),
        orderBy("created_at", "desc"),
        startAfter(oldestDoc),
        limit(25)
      );
      
      // Try cache first for "Load More" (might have cached older messages)
      let snap;
      try {
        snap = await getDocsFromCache(q);
        // If cache returned but is empty, fetch from server
        if (snap.docs.length === 0) {
          snap = await getDocsFromServer(q);
        }
      } catch (cacheError) {
        // Cache miss or error - fetch from server
        snap = await getDocsFromServer(q);
      }
      let items = snap.docs
        .map((d) => {
          const data = d.data() as any;
          let created;
          if (data.created_at && typeof data.created_at.toDate === "function") {
            created = data.created_at.toDate().toISOString();
          } else if (typeof data.created_at === "string") {
            created = new Date(data.created_at).toISOString();
          } else {
            created = new Date().toISOString();
          }
          let expireAtMs;
          if (data.expire_at && typeof data.expire_at.toDate === "function") {
            expireAtMs = data.expire_at.toDate().getTime();
          } else if (typeof data.expire_at === "string") {
            expireAtMs = new Date(data.expire_at).getTime();
          } else {
            expireAtMs = undefined;
          }
          return {
            id: d.id,
            username: data.username,
            content: data.content,
            created_at: created,
            reported: Boolean(data.reported),
            replyToMessageId: data.replyToMessageId || undefined,
            replyToContent: data.replyToContent || undefined,
            replyToUsername: data.replyToUsername || undefined,
            docSnap: d,
          };
        });
      items = items.reverse(); // so the oldest messages get prepended in the correct order
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id));
        return [...items.filter((msg) => !existingIds.has(msg.id)), ...prev];
      });
      if (snap.docs.length > 0) {
        setOldestDoc(snap.docs[snap.docs.length - 1]);
        setHasMore(snap.docs.length === 25);
      } else {
        // No more messages available
        setHasMore(false);
      }
    } catch (err) {
      console.error('Load More error:', err);
      toast({
        title: "Could not load more messages",
        description: "Please try again.",
        variant: "destructive",
      });
      setHasMore(false);
    }
    setIsLoading(false);
    // Allow auto-scroll again for future real-time updates
    skipAutoScrollRef.current = false;
  };
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

  const subscribeToMessages = async () => {
    setIsLoading(true);
    // Get the correct Firestore and Auth instances for this channel
    const channelDb = getFirestoreForChannel(channel);
    const channelAuth = getAuthForChannel(channel);
    
    // Ensure anonymous auth is ready before accessing Firestore
    if (!channelAuth.currentUser) {
      await signInAnonymously(channelAuth);
    }
    // 1) Load history once (newest 25) - cache-first strategy
    const historyQ = query(
      collection(channelDb, "messages"),
      where("channel", "==", channel),
      orderBy("created_at", "desc"),
      limit(25)
    );
    
    // Try cache first (instant, 0 reads)
    let historySnap;
    try {
      historySnap = await getDocsFromCache(historyQ);
      // If we got cached data, use it immediately
      if (historySnap.docs.length > 0) {
        const cachedItems = historySnap.docs
          .map((d) => {
            const data = d.data() as any;
            const created = data.created_at?.toDate
              ? data.created_at.toDate().toISOString()
              : (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString());
            return {
              id: d.id,
              username: data.username,
              content: data.content,
              created_at: created,
              reported: Boolean(data.reported),
              replyToMessageId: data.replyToMessageId || undefined,
              replyToContent: data.replyToContent || undefined,
              replyToUsername: data.replyToUsername || undefined,
              docSnap: d,
            };
          });
        setMessages(cachedItems.reverse());
        if (historySnap.docs.length > 0) {
          setOldestDoc(historySnap.docs[historySnap.docs.length - 1]);
          setHasMore(historySnap.docs.length === 25);
        } else {
          setOldestDoc(null);
          setHasMore(false);
        }
        setIsLoading(false);
      }
    } catch (cacheError) {
      // Cache miss - no cached data for this query, that's okay
      historySnap = null;
    }
    
    // Always fetch from server in background to update cache (costs reads but ensures freshness)
    try {
      historySnap = await getDocsFromServer(historyQ);
      const historyItems = historySnap.docs
        .map((d) => {
          const data = d.data() as any;
          const created = data.created_at?.toDate
            ? data.created_at.toDate().toISOString()
            : (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString());
          return {
            id: d.id,
            username: data.username,
            content: data.content,
            created_at: created,
            reported: Boolean(data.reported),
            replyToMessageId: data.replyToMessageId || undefined,
            replyToContent: data.replyToContent || undefined,
            replyToUsername: data.replyToUsername || undefined,
            docSnap: d,
          };
        });
      setMessages(historyItems.reverse());
      if (historySnap.docs.length > 0) {
        setOldestDoc(historySnap.docs[historySnap.docs.length - 1]);
        setHasMore(historySnap.docs.length === 25);
      } else {
        setOldestDoc(null);
        setHasMore(false);
      }
    } catch (serverError: any) {
      // Only log non-network errors (network errors are common and expected)
      if (serverError?.code !== 'unavailable' && serverError?.code !== 'deadline-exceeded') {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to fetch from server:', serverError?.message || serverError);
        }
      }
      // If we already have cached data, keep showing it; otherwise show error
      if (!historySnap || historySnap.docs.length === 0) {
        setIsLoading(false);
        // Only show error if it's a real problem, not just network issues
        if (serverError?.code === 'permission-denied') {
          toast({
            title: "Permission denied",
            description: "Please check your authentication.",
            variant: "destructive",
          });
        }
        return;
      }
    }
    
    // Mark the point in time we begin live listening - use the newest message's timestamp
    // If we have messages, use the newest one's timestamp. Otherwise, use now minus 1 second
    // to ensure we catch messages that might have been created just before we started listening
    if (historySnap && historySnap.docs.length > 0) {
      const newestMsg = historySnap.docs[0]; // Already sorted desc, so first is newest
      const newestTimestamp = newestMsg.data().created_at;
      if (newestTimestamp) {
        // Handle Firestore Timestamp
        if (newestTimestamp.toMillis && typeof newestTimestamp.toMillis === 'function') {
          liveSinceRef.current = Timestamp.fromMillis(newestTimestamp.toMillis());
        } else if (newestTimestamp instanceof Timestamp) {
          liveSinceRef.current = newestTimestamp;
        } else if (newestTimestamp.seconds) {
          liveSinceRef.current = Timestamp.fromMillis(newestTimestamp.seconds * 1000);
        } else {
          liveSinceRef.current = Timestamp.fromMillis(Date.now() - 1000);
        }
      } else {
        liveSinceRef.current = Timestamp.fromMillis(Date.now() - 1000);
      }
    } else {
      liveSinceRef.current = Timestamp.fromMillis(Date.now() - 1000); // 1 second ago to catch any recent messages
    }

    // 2) Live listener only for messages newer than the newest loaded message
    // onSnapshot automatically uses cache-first when persistentLocalCache is enabled
    if ((window as any).__bitswhisper_unsub) (window as any).__bitswhisper_unsub();
    const liveQ = query(
      collection(channelDb, "messages"),
      where("channel", "==", channel),
      orderBy("created_at", "asc"),
      startAfter(liveSinceRef.current as Timestamp)
    );
    
    // onSnapshot automatically uses cache-first when persistentLocalCache is enabled
    const unsub = onSnapshot(
      liveQ,
      {
        includeMetadataChanges: false, // Only trigger on actual data changes, not cache syncs
      },
      (snap) => {
        const added = snap.docChanges().filter((c) => c.type === 'added');
        if (added.length > 0) {
          const newMsgs: ChatMessage[] = added.map((change) => {
            const data = change.doc.data() as any;
            const created = data.created_at?.toDate
              ? data.created_at.toDate().toISOString()
              : (typeof data.created_at === 'string' ? data.created_at : new Date().toISOString());
            return {
              id: change.doc.id,
              username: data.username,
              content: data.content,
              created_at: created,
              reported: Boolean(data.reported),
              replyToMessageId: data.replyToMessageId || undefined,
              replyToContent: data.replyToContent || undefined,
              replyToUsername: data.replyToUsername || undefined,
            } as ChatMessage;
          });
          
          // Add new messages, filtering out any duplicates
          setMessages((prev) => {
            const prevIds = new Set(prev.map(m => m.id));
            const uniqueNew = newMsgs.filter(m => !prevIds.has(m.id));
            if (uniqueNew.length > 0) {
              return [...prev, ...uniqueNew];
            }
            return prev;
          });
        }
        setIsLoading(false);
      },
      (error: any) => {
        // Only log non-network errors (network hiccups are common and expected)
        // Firestore automatically retries, so we don't need to show errors for transient issues
        if (error?.code === 'unavailable' || error?.code === 'deadline-exceeded') {
          // Network issues - Firestore will retry automatically, just log silently
          if (process.env.NODE_ENV === 'development') {
            console.debug('Real-time listener connection issue (will retry):', error?.code);
          }
        } else if (error?.code === 'failed-precondition') {
          // Missing composite index - show helpful message
          console.error('Real-time listener: Composite index missing:', error);
          if (process.env.NODE_ENV === 'development') {
            console.error('Error details:', error.message);
          }
          
          // Extract index URL from error if available
          let indexUrl = null;
          if (error.message) {
            const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
            if (urlMatch) {
              indexUrl = urlMatch[0];
              if (process.env.NODE_ENV === 'development') {
                console.log('Index creation URL:', indexUrl);
              }
            }
          }
          
          toast({
            title: "Index Required",
            description: indexUrl 
              ? "Composite index needed. Check console for creation link. Real-time updates will work after index is created."
              : "Please create composite index: Collection 'messages', Fields: channel (Ascending) + created_at (Descending). Real-time updates disabled until index is created.",
            variant: "default",
            duration: 10000, // Show longer so user can read it
          });
          
          // Note: Messages will still load from cache, but real-time updates won't work until index is created
        } else if (error?.code === 'permission-denied') {
          // Permission errors are real problems
          console.error('Real-time listener permission denied:', error);
          toast({
            title: "Permission denied",
            description: "Unable to receive real-time updates. Please refresh.",
            variant: "destructive",
          });
        } else {
          // Other errors might be worth logging
          if (process.env.NODE_ENV === 'development') {
            console.warn('Real-time listener error:', error?.code || error?.message || error);
          }
        }
        setIsLoading(false);
      }
    );
    (window as any).__bitswhisper_unsub = unsub;
  };

  // Called on channel change
  useEffect(() => {
    setMessages([]);
    setOldestDoc(null);
    setHasMore(true);
    // Next snapshot for this channel is initial
    isInitialSnapshotRef.current = true;
    
    // Verify Support channel isolation (only in development)
    if (channel === "support" && process.env.NODE_ENV === "development") {
      verifySupportChannelIsolation();
    }
    
    subscribeToMessages();
    return () => {
      if ((window as any).__bitswhisper_unsub) (window as any).__bitswhisper_unsub();
    };
    // eslint-disable-next-line
  }, [channel]);

  useEffect(() => {
    if (messages.length > 0 && !skipAutoScrollRef.current) {
      scrollToBottom();
    }
    // eslint-disable-next-line
  }, [messages]);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    
    // Get the correct Firestore and Auth instances for this channel
    const channelDb = getFirestoreForChannel(channel);
    const channelAuth = getAuthForChannel(channel);
    
    // Ensure anonymous auth is ready
    if (!channelAuth.currentUser) {
      try {
        await signInAnonymously(channelAuth);
      } catch (authError) {
        console.error('Auth error:', authError);
        toast({
          title: "Authentication failed",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }
    
    if (!channelAuth.currentUser) {
      toast({
        title: "Authentication required",
        description: "Please refresh the page.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const messageData: any = {
        channel,
        username,
        content,
        created_at: serverTimestamp(),
        reported: false,
        report_count: 0,
      };

      // Add reply data if replying to a message
      if (replyToMessage) {
        messageData.replyToMessageId = replyToMessage.id;
        messageData.replyToContent = replyToMessage.content;
        messageData.replyToUsername = replyToMessage.username;
      }

      await addDoc(collection(channelDb, 'messages'), messageData);
      
      // Clear reply state after sending
      setReplyToMessage(null);
      
      // Message sent successfully - real-time listener will pick it up
    } catch (error: any) {
      // Only log meaningful errors (not network hiccups)
      if (error?.code !== 'unavailable' && error?.code !== 'deadline-exceeded') {
        console.error('Error sending message:', error);
        if (process.env.NODE_ENV === 'development') {
          console.error('Channel:', channel);
          console.error('Is location channel:', channel !== 'general' && channel !== 'confessions' && channel !== 'support');
          console.error('Auth user:', channelAuth.currentUser?.uid);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
        }
      }
      
      let errorMessage = "Please try again.";
      if (error.code === 'permission-denied') {
        errorMessage = "Permission denied. Check security rules and authentication.";
      } else if (error.code === 'unavailable') {
        errorMessage = "Connection issue. Please check your internet and try again.";
      } else if (error.code === 'deadline-exceeded') {
        errorMessage = "Request timed out. Please try again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to send message",
        description: errorMessage,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  const reportMessage = async (messageId: string) => {
    try {
      // Get the correct Firestore instance for this channel
      const channelDb = getFirestoreForChannel(channel);
      const messageRef = doc(channelDb, 'messages', messageId);
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

      <div ref={messageListRef} className="mobile-messages flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-4 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-white/50 mb-2">No messages yet</p>
              <p className="text-sm text-white/50">Be the first to share something!</p>
            </div>
          </div>
        ) : (
          <>
            {showLoadMore && (
              <button
                className="w-full mb-2 py-2 bg-[#222] text-white/60 rounded hover:bg-[#333] transition disabled:opacity-60"
                onClick={handleLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </button>
            )}
            {messages.map((message, idx) => {
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
            })}
            <div ref={messagesEndRef} />
          </>
        )}
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