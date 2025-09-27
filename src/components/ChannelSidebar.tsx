import { Hash, Heart, MessageCircle, Utensils, GraduationCap, Monitor, Building, Users, Globe, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Channel {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category?: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  channels: Channel[];
}

// Original channels (always visible)
const originalChannels: Channel[] = [
  {
    id: "general",
    name: "General",
    icon: <Globe className="w-4 h-4" />,
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

// New categorized channels
const categories: Category[] = [
  {
    id: "food",
    name: "Food Outlets",
    icon: <Utensils className="w-4 h-4" />,
    channels: [
      { id: "subspot", name: "Subspot", icon: <Utensils className="w-4 h-4" />, description: "Subspot discussions", category: "food" },
      { id: "fk", name: "FK", icon: <Utensils className="w-4 h-4" />, description: "FK food court", category: "food" },
      { id: "ins", name: "INS", icon: <Utensils className="w-4 h-4" />, description: "INS canteen", category: "food" },
      { id: "gajalaxmi", name: "Gajalaxmi", icon: <Utensils className="w-4 h-4" />, description: "Gajalaxmi restaurant", category: "food" },
      { id: "foodtruck", name: "Food truck", icon: <Utensils className="w-4 h-4" />, description: "Food truck area", category: "food" },
    ]
  },
  {
    id: "lecture",
    name: "Lecture Halls",
    icon: <GraduationCap className="w-4 h-4" />,
    channels: [
      { id: "lt1", name: "LT1", icon: <GraduationCap className="w-4 h-4" />, description: "Lecture Theatre 1", category: "lecture" },
      { id: "lt2", name: "LT2", icon: <GraduationCap className="w-4 h-4" />, description: "Lecture Theatre 2", category: "lecture" },
      { id: "lt3", name: "LT3", icon: <GraduationCap className="w-4 h-4" />, description: "Lecture Theatre 3", category: "lecture" },
      { id: "lt4", name: "LT4", icon: <GraduationCap className="w-4 h-4" />, description: "Lecture Theatre 4", category: "lecture" },
    ]
  },
  {
    id: "digital",
    name: "Digital Lecture Halls",
    icon: <Monitor className="w-4 h-4" />,
    channels: [
      { id: "dlt1", name: "DLT1", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 1", category: "digital" },
      { id: "dlt2", name: "DLT2", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 2", category: "digital" },
      { id: "dlt3", name: "DLT3", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 3", category: "digital" },
      { id: "dlt4", name: "DLT4", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 4", category: "digital" },
      { id: "dlt5", name: "DLT5", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 5", category: "digital" },
      { id: "dlt6", name: "DLT6", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 6", category: "digital" },
      { id: "dlt7", name: "DLT7", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 7", category: "digital" },
      { id: "dlt8", name: "DLT8", icon: <Monitor className="w-4 h-4" />, description: "Digital Lecture Theatre 8", category: "digital" },
    ]
  },
  {
    id: "campus",
    name: "Campus Facilities",
    icon: <Building className="w-4 h-4" />,
    channels: [
      { id: "library", name: "Library", icon: <Building className="w-4 h-4" />, description: "Library discussions", category: "campus" },
      { id: "auditorium", name: "Auditorium", icon: <Building className="w-4 h-4" />, description: "Auditorium events", category: "campus" },
      { id: "sac", name: "SAC", icon: <Building className="w-4 h-4" />, description: "Student Activity Center", category: "campus" },
      { id: "gym", name: "GYM", icon: <Building className="w-4 h-4" />, description: "Gymnasium discussions", category: "campus" },
    ]
  },
  {
    id: "mess",
    name: "Mess",
    icon: <Users className="w-4 h-4" />,
    channels: [
      { id: "amess", name: "A Mess", icon: <Users className="w-4 h-4" />, description: "A Mess discussions", category: "mess" },
      { id: "cmess", name: "C Mess", icon: <Users className="w-4 h-4" />, description: "C Mess discussions", category: "mess" },
      { id: "dmess", name: "D Mess", icon: <Users className="w-4 h-4" />, description: "D Mess discussions", category: "mess" },
    ]
  }
];

interface ChannelSidebarProps {
  selectedChannel: string;
  onChannelSelect: (channelId: string) => void;
  onClose?: () => void;
}

export default function ChannelSidebar({ selectedChannel, onChannelSelect, onClose }: ChannelSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubChannel, setSelectedSubChannel] = useState<string>("");

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubChannel(""); // Reset sub-channel when category changes
  };

  const handleSubChannelChange = (channelId: string) => {
    setSelectedSubChannel(channelId);
    onChannelSelect(channelId);
  };

  const getCurrentCategory = () => {
    return categories.find(cat => cat.id === selectedCategory);
  };

  const getCurrentChannels = () => {
    const category = getCurrentCategory();
    return category ? category.channels : [];
  };
  return (
    <div className="w-72 border-r border-sidebar-border h-screen flex flex-col relative z-50 overflow-hidden mobile-safe-top mobile-safe-bottom" style={{ backgroundColor: '#242018' }}>
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white header-font">BITS Whispers</h1>
          <p className="text-sm text-white/60 mt-1">Speak it, Don't keep it!</p>
        </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-transparent">
        {/* Original Channels Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Main Channels</h3>
          <div className="space-y-2">
            {originalChannels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => onChannelSelect(channel.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-all duration-300 group button-hover",
                  "hover:scale-[1.02] hover:shadow-soft",
                  selectedChannel === channel.id 
                    ? "bg-[#D97B2D] text-[#FDFFFC] shadow-soft scale-[1.02]" 
                    : "hover:bg-white/5"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-md transition-all duration-300 group-hover:scale-110 button-hover",
                    selectedChannel === channel.id 
                      ? "bg-[#B36224] text-[#FDFFFC] shadow-glow" 
                      : "bg-white/10 text-white/60 group-hover:text-white group-hover:shadow-glow"
                  )}>
                    {channel.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-medium transition-colors",
                      selectedChannel === channel.id 
                        ? "text-[#FDFFFC]" 
                        : "text-white/90 group-hover:text-white"
                    )}>
                      {channel.name}
                    </h3>
                    <p className={cn(
                      "text-xs transition-colors",
                      selectedChannel === channel.id 
                        ? "text-[#FDFFFC]/70" 
                        : "text-white/50 group-hover:text-white/70"
                    )}>
                      {channel.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3">Location Channels</h3>
          <div className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <label className="text-xs text-white/60 mb-2 block">Select Category</label>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white hover:scale-[1.02] hover:shadow-soft transition-all duration-300 button-hover">
                  <SelectValue placeholder="Choose a category..." />
                </SelectTrigger>
                <SelectContent className="bg-[#242018] border-white/10 z-[80]" position="popper" side="bottom" align="start">
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} className="hover:bg-white/5 text-white">
                      <div className="flex items-center space-x-2">
                        {category.icon}
                        <span className="text-white">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Channel Dropdown */}
            {selectedCategory && (
              <div>
                <label className="text-xs text-white/60 mb-2 block">Select Channel</label>
                <Select value={selectedSubChannel} onValueChange={handleSubChannelChange}>
                  <SelectTrigger className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white hover:scale-[1.02] hover:shadow-soft transition-all duration-300 button-hover">
                    <SelectValue placeholder="Choose a channel..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#242018] border-white/10 max-h-60 z-[80]" position="popper" side="bottom" align="start">
                    {getCurrentChannels().map((channel) => (
                      <SelectItem key={channel.id} value={channel.id} className="hover:bg-white/5 text-white">
                        <div className="flex items-center space-x-2">
                          {channel.icon}
                          <span className="text-white">{channel.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-accent rounded-lg p-3 hover:shadow-soft transition-all duration-200">
          <p className="text-xs text-muted-foreground">
            Messages auto-delete after 24 hours. No personal data is stored.
          </p>
        </div>
      </div>
    </div>
  );
}