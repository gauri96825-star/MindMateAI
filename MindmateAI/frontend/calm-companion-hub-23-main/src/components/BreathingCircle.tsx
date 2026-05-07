import { useState, useEffect, useCallback } from "react";

type Phase = "inhale" | "hold" | "exhale" | "rest";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inhale", label: "Breathe In", duration: 4000 },
  { phase: "hold", label: "Hold", duration: 4000 },
  { phase: "exhale", label: "Breathe Out", duration: 6000 },
  { phase: "rest", label: "Rest", duration: 2000 },
];

export function BreathingCircle() {
  const [isActive, setIsActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [cycles, setCycles] = useState(0);

  const currentPhase = PHASES[phaseIndex];

  const nextPhase = useCallback(() => {
    setPhaseIndex((prev) => {
      const next = (prev + 1) % PHASES.length;
      if (next === 0) setCycles((c) => c + 1);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isActive) return;
    const timer = setTimeout(nextPhase, currentPhase.duration);
    return () => clearTimeout(timer);
  }, [isActive, phaseIndex, currentPhase.duration, nextPhase]);

  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
      setPhaseIndex(0);
    } else {
      setIsActive(true);
      setCycles(0);
      setPhaseIndex(0);
    }
  };

  const scale = currentPhase.phase === "inhale" || currentPhase.phase === "hold" ? 1.5 : 1;
  const opacity = currentPhase.phase === "inhale" || currentPhase.phase === "hold" ? 1 : 0.6;

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="relative flex h-64 w-64 items-center justify-center">
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-full bg-primary/20 transition-all"
          style={{
            transform: `scale(${isActive ? scale * 1.1 : 1})`,
            opacity: isActive ? opacity * 0.5 : 0.3,
            transitionDuration: `${currentPhase.duration}ms`,
            transitionTimingFunction: "ease-in-out",
          }}
        />
        {/* Main circle */}
        <div
          className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/60 to-primary/30 shadow-lg transition-all"
          style={{
            transform: `scale(${isActive ? scale : 1})`,
            opacity: isActive ? opacity : 0.5,
            transitionDuration: `${currentPhase.duration}ms`,
            transitionTimingFunction: "ease-in-out",
          }}
        />
        {/* Inner circle */}
        <div
          className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-primary/80 shadow-inner transition-all"
          style={{
            transform: `scale(${isActive ? scale * 0.8 : 0.8})`,
            transitionDuration: `${currentPhase.duration}ms`,
            transitionTimingFunction: "ease-in-out",
          }}
        >
          <span className="text-xs font-medium text-primary-foreground">
            {isActive ? currentPhase.label : "Start"}
          </span>
        </div>
      </div>

      {isActive && (
        <p className="animate-fade-up text-sm text-muted-foreground">
          Cycle {cycles + 1} · {currentPhase.label}
        </p>
      )}

      <button
        onClick={handleToggle}
        className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
      >
        {isActive ? "Stop" : "Begin Breathing"}
      </button>
    </div>
  );
}
