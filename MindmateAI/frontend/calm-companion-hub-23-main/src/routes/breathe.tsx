import { BreathingCircle } from "@/components/BreathingCircle";
import { Wind } from "lucide-react";

export default function BreathePage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
        <Wind className="h-4 w-4" />
        Guided Breathing
      </div>
      <h1 className="mb-2 text-center text-3xl font-bold text-foreground">
        Find Your Calm
      </h1>
      <p className="mb-12 max-w-md text-center text-muted-foreground">
        Follow the expanding circle. Breathe in as it grows, hold, then breathe out as it shrinks.
      </p>
      <BreathingCircle />
    </div>
  );
}
