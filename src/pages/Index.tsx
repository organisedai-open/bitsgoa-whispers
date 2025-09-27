import { useState, useEffect } from "react";
import ChannelSidebar from "@/components/ChannelSidebar";
import ChatArea from "@/components/ChatArea";
import UsernamePrompt from "@/components/UsernamePrompt";
import { getSessionId } from "@/utils/session";
import { deleteExpiredMessages } from "@/utils/cleanup";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    // Clean expired messages on load and every 10 minutes
    deleteExpiredMessages();
    const interval = setInterval(deleteExpiredMessages, 10 * 60 * 1000);
    
    // Add event listener for sidebar toggle
    const handleToggleSidebar = () => setSidebarOpen(prev => !prev);
    window.addEventListener('toggle-sidebar', handleToggleSidebar);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('toggle-sidebar', handleToggleSidebar);
    };
  }, []);

  const handleUsernameSet = (newUsername: string) => {
    sessionStorage.setItem("anonymous_username", newUsername);
    setUsername(newUsername);
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