import { useState, useEffect } from "react";
import { Music, Lightbulb, Heart, Sparkles, Play, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getWellnessRecommendations, type WellnessRecommendation } from "@/lib/api";
import { YouTubePlayer } from "@/components/YouTubePlayer";
import { cn } from "@/lib/utils";

const WELLNESS_TIPS: Record<string, string[]> = {
  happy: [
    "Practice gratitude — write down 3 things you're thankful for today.",
    "Share your joy with someone you love. Connection amplifies happiness.",
    "Channel this energy into something creative — paint, write, or cook something new.",
  ],
  calm: [
    "Enjoy this peaceful moment. Try a 5-minute body scan meditation.",
    "Nature amplifies calm — take a short walk outside if you can.",
    "This is a great time for reflection. Consider journaling your thoughts.",
  ],
  anxious: [
    "Try the 5-4-3-2-1 grounding technique: name 5 things you see, 4 you touch, 3 you hear, 2 you smell, 1 you taste.",
    "Limit caffeine and try herbal tea.",
    "Remember: anxiety is your body trying to protect you.",
  ],
  general: [
    "Take deep breaths: 4s inhale, 4s hold, 4s exhale.",
    "Stay hydrated and take small breaks every hour.",
    "Acknowledge your feelings without judgment."
  ]
};

export default function WellnessPage() {
  const { user } = useAuth();
  const [data, setData] = useState<WellnessRecommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSong, setActiveSong] = useState<{ id: string; title: string; artist: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRecs = async () => {
      try {
        const recs = await getWellnessRecommendations();
        setData(recs);
      } catch (err) {
        console.error("Failed to fetch wellness data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please sign in to access wellness features.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 pb-32">
      {/* Header Section */}
      <div className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
          <Sparkles className="h-3 w-3" /> Personalized Wellness
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Your Wellness Hub</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          {data?.mood_summary || "Analyzing your current state to curate the perfect experience..."}
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        {/* Music Section (Primary) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Music className="h-6 w-6 text-primary" /> Music for Your Mind
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {data && Object.entries(data.categories).map(([category, songs]) => (
              <div key={category} className="space-y-4 col-span-full">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest px-1">{category}</h3>
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                   {songs.map((song) => (
                    <button 
                      key={song.youtube_id}
                      onClick={() => setActiveSong({ id: song.youtube_id, title: song.title, artist: song.artist })}
                      className={cn(
                        "group relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                        activeSong?.id === song.youtube_id ? "ring-2 ring-primary ring-offset-4 ring-offset-background shadow-xl" : "hover:shadow-lg"
                      )}
                    >
                      <img 
                        src={song.thumbnail_url} 
                        alt={song.title} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                        <div className="flex items-center justify-between">
                          <div className="overflow-hidden">
                            <p className="text-white font-bold text-sm truncate">{song.title}</p>
                            <p className="text-white/70 text-[10px] truncate uppercase">{song.artist}</p>
                          </div>
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                             <Play className="h-4 w-4 fill-current" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Section (Sidebar) */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-warmth" /> Wellness Tips
          </h2>
          <div className="space-y-4">
            {(WELLNESS_TIPS.general).map((tip, i) => (
               <div key={i} className="glass-card p-5 rounded-2xl border-white/40 hover:bg-white/60 transition-colors">
                  <div className="flex gap-4">
                    <div className="h-8 w-8 rounded-xl bg-warmth/10 flex items-center justify-center text-warmth shrink-0 mt-1">
                      <Heart className="h-4 w-4" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{tip}</p>
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>

      {activeSong && (
        <YouTubePlayer 
          videoId={activeSong.id} 
          title={activeSong.title} 
          artist={activeSong.artist} 
          onClose={() => setActiveSong(null)} 
        />
      )}
    </div>
  );
}
