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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to BITS Anonymous Chat</CardTitle>
          <CardDescription>
            Choose your anonymous username for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Your Username
              </label>
              <div className="flex gap-2">
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username..."
                  maxLength={20}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={generateNewUsername}
                  title="Generate new username"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This username is temporary and will reset when you close your browser
              </p>
            </div>
            <Button type="submit" className="w-full">
              Start Chatting
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}