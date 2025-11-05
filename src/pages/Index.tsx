import { useState, useEffect } from "react";
import ChannelSidebar from "@/components/ChannelSidebar";
import ChatArea from "@/components/ChatArea";
import UsernamePrompt from "@/components/UsernamePrompt";
import { getSessionId } from "@/utils/session";
// Client-side cleanup removed to prevent excessive reads; use Firestore TTL instead
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rtdb, auth } from "@/integrations/firebase/client";
import { ref, runTransaction, serverTimestamp as rtdbServerTimestamp } from "firebase/database";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [username, setUsername] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check for existing username
    const storedUsername = sessionStorage.getItem("anonymous_username");
    if (storedUsername) {
      setUsername(storedUsername);
    }
    
    setSessionId(getSessionId());
    // Do not run client-side cleanup to avoid large read spikes.
    // Configure Firestore TTL on expire_at for automatic deletions.
    
    // Add event listener for sidebar toggle
    const handleToggleSidebar = () => setSidebarOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  const { toast } = useToast();

  const handleUsernameSet = async (newUsername: string) => {
    const normalized = newUsername.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    try {
      // Wait for anonymous auth to complete (required for secure rules)
      if (!auth.currentUser) {
        await signInAnonymously(auth);
      }
      const userId = auth.currentUser?.uid;
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please refresh the page.",
          variant: "destructive",
        });
        return;
      }
      const usernameRef = ref(rtdb, `usernames/${key}`);
      const result = await runTransaction(usernameRef, (current) => {
        // If not taken or taken by the same user, reserve/update.
        if (!current || current.userId === userId) {
          return {
            username: normalized,
            userId,
            reservedAt: rtdbServerTimestamp(),
          } as any;
        }
        // Abort transaction by returning current (no write)
        return current;
      }, {applyLocally: false});

      if (!result.committed || (result.snapshot && result.snapshot.val() && result.snapshot.val().userId !== userId)) {
        toast({
          title: "Username unavailable",
          description: "Please choose a different anonymous username.",
          variant: "destructive",
        });
        return;
      }
      sessionStorage.setItem("anonymous_username", normalized);
      setUsername(normalized);
    } catch (e) {
      toast({
        title: "Could not set username",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show username prompt if no username is set
  if (!username) {
    return <UsernamePrompt onUsernameSet={handleUsernameSet} />;
  }

  return (
    <div className="flex h-screen mobile-layout mobile-full-height lg:h-screen overflow-hidden" style={{ backgroundColor: '#1F1C09' }}>
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <ChannelSidebar 
          selectedChannel={selectedChannel}
          onChannelSelect={setSelectedChannel}
        />
      </div>

      {/* Sidebar - Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`
        lg:hidden mobile-sidebar
        ${sidebarOpen ? 'open' : ''}
      `}>
        <ChannelSidebar 
          selectedChannel={selectedChannel}
          onChannelSelect={(channel) => {
            setSelectedChannel(channel);
            setSidebarOpen(false);
          }}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Chat Area */}
      <ChatArea 
        channel={selectedChannel}
        username={username}
        sessionId={sessionId}
      />
    </div>
  );
};

export default Index;