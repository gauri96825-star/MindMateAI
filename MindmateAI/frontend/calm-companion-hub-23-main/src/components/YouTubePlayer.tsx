import React, { useState } from "react";
import { X, Maximize2, Minimize2, Play, Pause, Music, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface YouTubePlayerProps {
  videoId: string;
  title: string;
  artist: string;
  onClose: () => void;
}

export function YouTubePlayer({ videoId, title, artist, onClose }: YouTubePlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-500 ease-in-out",
        isExpanded
          ? "w-[400px] md:w-[600px] h-[300px] md:h-[450px]"
          : "w-[300px] h-[80px]"
      )}
    >
      <div className="h-full w-full glass-card rounded-2xl overflow-hidden shadow-2xl border border-primary/20 flex flex-col">
        {/* Header/Control Bar */}
        <div className="p-3 bg-secondary/30 backdrop-blur-md flex items-center justify-between border-b border-primary/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0",
              !isExpanded && "animate-spin-slow"
            )}>
              <Music className="h-5 w-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-foreground leading-tight">{title}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-widest">{artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Area */}
        <div className={cn(
          "flex-1 bg-black relative transition-all duration-500",
          !isExpanded && "hidden"
        )}>
          {isExpanded ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://youtu.be/ghPcYqn0p4Y?si=RShq7eJ01V68BJgk`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0"
            ></iframe>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-calm/5">
              <Sparkles className="h-8 w-8 text-primary/20 animate-pulse" />
            </div>
          )}
        </div>

        {/* Mini Player Status (Visible when collapsed) */}
        {!isExpanded && (
          <div className="px-4 py-2 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase">Playing Wellness Track</span>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-[10px] font-bold text-primary hover:underline"
            >
              EXPAND PLAYER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
