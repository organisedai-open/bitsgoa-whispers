import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { generateUsername } from "@/utils/username-generator";
import { RefreshCw } from "lucide-react";

interface UsernamePromptProps {
  onUsernameSet: (username: string) => void;
}

export default function UsernamePrompt({ onUsernameSet }: UsernamePromptProps) {
  const [username, setUsername] = useState(generateUsername());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onUsernameSet(username.trim());
    }
  };

  const generateNewUsername = () => {
    setUsername(generateUsername());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#1F1C09' }}>
      {/* Optional blurred accent shape */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-teal-400/3 to-transparent rounded-full blur-3xl"></div>
      </div>
      
      <Card className="w-full max-w-md bg-black/20 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl relative z-10">
        <CardHeader className="text-center space-y-4 pb-8">
          <CardTitle className="text-2xl font-semibold text-white">
            Welcome to BITS Anonymous Chat
          </CardTitle>
          <CardDescription className="text-sm text-white/60 leading-relaxed">
            Choose your anonymous username for this session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label htmlFor="username" className="text-sm font-medium text-white/90 block">
                Your Username
              </label>
              <div className="relative">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  maxLength={20}
                  className="w-full h-12 px-4 pr-12 text-white bg-black/30 border border-white/20 rounded-xl focus:border-[#D97B2D] focus:ring-2 focus:ring-[#D97B2D]/20 focus:bg-black/40 transition-all duration-300 hover:border-white/30 placeholder:text-white/40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={generateNewUsername}
                  title="Generate new username"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-white/60 hover:text-[#D97B2D] hover:bg-[#D97B2D]/10 rounded-lg transition-all duration-200 hover:scale-110"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-white/50 leading-relaxed">
                This username is temporary and will reset when you close your browser
              </p>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-[#D97B2D] hover:bg-[#B36224] text-white font-semibold rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#D97B2D]/25 active:scale-[0.98]"
            >
              Start Chatting
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}