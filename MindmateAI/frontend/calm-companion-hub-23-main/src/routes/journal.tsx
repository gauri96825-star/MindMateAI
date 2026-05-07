import { useState, useEffect } from "react";
import { BookOpen, Plus, Calendar, BarChart3, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MoodSelector } from "@/components/MoodSelector";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { saveJournalEntry, getJournalEntries, analyzeText } from "@/lib/api";
import type { JournalEntry } from "@/lib/api";
import { toast } from "sonner";

export default function JournalPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load entries from backend
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const serverEntries = await getJournalEntries();
        setEntries(serverEntries);
      } catch {
        // Backend not available — keep empty
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please sign in to use the journal.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleSave = async () => {
    if (!content.trim() || !mood) return;
    setIsSaving(true);

    try {
      // Save entry via backend
      const saved = await saveJournalEntry(content.trim(), mood);

      // Also run analysis
      try {
        const analysis = await analyzeText(content.trim());
        saved.rumination_score = analysis.clean_score;
        saved.emotion_label = analysis.clean_emotion;
      } catch {
        // analysis failed, that's ok
      }

      setEntries((prev) => [saved, ...prev]);
      toast.success("Journal entry saved!");
    } catch {
      // Fallback: save locally
      const entry: JournalEntry = {
        id: Date.now().toString(),
        content: content.trim(),
        mood,
        created_at: new Date().toISOString(),
      };
      setEntries((prev) => [entry, ...prev]);
      toast.success("Entry saved locally.");
    }

    setContent("");
    setMood(null);
    setIsWriting(false);
    setIsSaving(false);
  };

  const moodEmojis: Record<string, string> = {
    happy: "😊", calm: "😌", anxious: "😰", sad: "😢",
    frustrated: "😤", tired: "😴", thoughtful: "🤔", numb: "😶",
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen className="h-6 w-6 text-primary" /> My Journal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Express your thoughts freely.</p>
        </div>
        {!isWriting && (
          <Button onClick={() => setIsWriting(true)} className="gap-2 rounded-full">
            <Plus className="h-4 w-4" /> New Entry
          </Button>
        )}
      </div>

      {isWriting && (
        <div className="mb-8 animate-[fade-up_0.3s_ease-out] rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">How are you feeling?</h2>
          <MoodSelector selected={mood} onSelect={setMood} />
          <div className="mt-6">
            <Textarea
              placeholder="Write about what's on your mind..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none rounded-xl"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleSave} disabled={!content.trim() || !mood || isSaving} className="rounded-full gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSaving ? "Saving..." : "Save Entry"}
            </Button>
            <Button variant="ghost" onClick={() => { setIsWriting(false); setContent(""); setMood(null); }} className="rounded-full">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {entries.length === 0 && !isWriting ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-16 text-center">
          <BookOpen className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <p className="text-muted-foreground">No journal entries yet.</p>
          <p className="text-sm text-muted-foreground/70">Start writing to track your emotions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{moodEmojis[entry.mood] || "😊"}</span>
                  <span className="text-sm font-medium capitalize text-card-foreground">{entry.mood}</span>
                </div>
                <div className="flex items-center gap-3">
                  {entry.rumination_score !== undefined && (
                    <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <BarChart3 className="h-3 w-3" />
                      Score: {entry.rumination_score}/10
                    </div>
                  )}
                  {entry.emotion_label && (
                    <span className="rounded-full bg-warmth/10 px-2.5 py-0.5 text-xs font-medium text-warmth-foreground">
                      {entry.emotion_label}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(entry.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground/80">{entry.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
