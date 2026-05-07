import { cn } from "@/lib/utils";

const MOODS = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "😰", label: "Anxious", value: "anxious" },
  { emoji: "😢", label: "Sad", value: "sad" },
  { emoji: "😤", label: "Frustrated", value: "frustrated" },
  { emoji: "😴", label: "Tired", value: "tired" },
  { emoji: "🤔", label: "Thoughtful", value: "thoughtful" },
  { emoji: "😶", label: "Numb", value: "numb" },
];

interface MoodSelectorProps {
  selected: string | null;
  onSelect: (mood: string) => void;
}

export function MoodSelector({ selected, onSelect }: MoodSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {MOODS.map((mood) => (
        <button
          key={mood.value}
          onClick={() => onSelect(mood.value)}
          className={cn(
            "flex flex-col items-center gap-1.5 rounded-xl p-3 transition-all hover:bg-accent",
            selected === mood.value
              ? "bg-primary/10 ring-2 ring-primary shadow-sm"
              : "bg-card border"
          )}
        >
          <span className="text-2xl">{mood.emoji}</span>
          <span className="text-xs text-muted-foreground">{mood.label}</span>
        </button>
      ))}
    </div>
  );
}
