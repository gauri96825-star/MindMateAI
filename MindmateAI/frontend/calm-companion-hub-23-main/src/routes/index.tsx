import { Link } from "react-router-dom";
import { Brain, MessageCircle, Wind, BookOpen, Music, Heart, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AnalysisDashboard } from "@/components/AnalysisDashboard";

const features = [
  {
    icon: MessageCircle,
    title: "AI Chat Support",
    description: "Talk through your feelings with an empathetic AI companion focused on mental wellness.",
    link: "/chat",
  },
  {
    icon: Wind,
    title: "Breathing Exercises",
    description: "Guided breathing techniques to help you relax, reduce anxiety, and find calm.",
    link: "/breathe",
  },
  {
    icon: BookOpen,
    title: "Journaling",
    description: "Express your thoughts and track your emotional journey over time.",
    link: "/journal",
  },
  {
    icon: Music,
    title: "Wellness & Music",
    description: "Mood-based music suggestions and wellness tips tailored to how you feel.",
    link: "/wellness",
  },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] zen-gradient">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-16 text-center md:py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary/20 via-calm/20 to-warmth/20 blur-3xl animate-pulse-soft" />
          <div className="absolute right-1/4 top-1/4 h-80 w-80 rounded-full bg-primary/10 blur-2xl animate-[float_10s_ease-in-out_infinite]" />
          <div className="absolute left-1/4 bottom-1/4 h-64 w-64 rounded-full bg-calm/10 blur-3xl animate-[float_12s_ease-in-out_infinite_2s]" />
        </div>

        <div className="mx-auto max-w-2xl animate-[fade-up_0.6s_ease-out]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            Your mental wellness companion
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Find clarity.{" "}
            <span className="bg-gradient-to-r from-primary to-calm bg-clip-text text-transparent">Find calm.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground leading-relaxed">
            MindMate AI helps you navigate your emotions with empathetic conversations,
            guided breathing, journaling, and personalized wellness support.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            {user ? (
              <Link to="/chat">
                <Button size="lg" className="gap-2 rounded-full px-8 shadow-md hover:shadow-lg transition-shadow">
                  <MessageCircle className="h-5 w-5" /> Start a Conversation
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="lg" className="gap-2 rounded-full px-8 shadow-md hover:shadow-lg transition-shadow">
                  Get Started Free
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
      
      {/* Analysis Dashboard for Auth Users */}
      {user && (
        <section className="px-4 py-8">
          <div className="mx-auto max-w-5xl">
            <AnalysisDashboard />
          </div>
        </section>
      )}

      {/* Features */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold text-foreground md:text-3xl">
            Tools for your mental wellbeing
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Link key={feature.title} to={user ? feature.link : "/login"}>
                <div className="group rounded-2xl border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-card-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t px-4 py-12">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Private & Secure
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-primary" /> Empathetic AI
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Evidence-Based
          </div>
        </div>
      </section>
    </div>
  );
}
