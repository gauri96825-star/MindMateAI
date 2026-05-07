import React, { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from "recharts";
import { Brain, Heart, Sparkles, TrendingUp, Activity } from "lucide-react";
import api from "@/lib/api";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

export function AnalysisDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const response = await api.get("/dashboard/summary");
        setData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard summary", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  const onPieEnter = (_: any, index: number) => {
    setActivePieIndex(index);
  };

  const onPieLeave = () => {
    setActivePieIndex(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Activity className="h-8 w-8 animate-spin text-primary/50" />
    </div>
  );

  if (!data || (data.trends.length === 0 && data.emotions.length === 0)) {
    return (
      <div className="rounded-3xl bg-secondary/30 p-8 text-center glass-card mx-auto max-w-4xl mb-12">
        <Sparkles className="h-10 w-10 mx-auto mb-4 text-primary/40" />
        <h3 className="text-xl font-semibold mb-2">Begin Your Journey</h3>
        <p className="text-muted-foreground">Start journaling or chat with MindMate to see your emotional analysis here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-[fade-up_0.8s_ease-out] mb-12">
      {/* Holistic Insight Header */}
      <div className="glass-card rounded-3xl p-6 bg-gradient-to-br from-primary/5 to-calm/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="hidden md:flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shrink-0 transition-transform hover:scale-105 duration-300">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-primary uppercase tracking-widest">Holistic Mind Insight</h3>
            <p className="text-lg font-medium text-foreground leading-snug">
              {data.reason || "Analyzing your recent chats and journal entries to find patterns..."}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
               <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20">
                Context: {data.trends.length} Records
              </span>
              <span className="px-2 py-0.5 rounded-full bg-calm/10 text-calm text-[10px] font-bold uppercase border border-calm/20">
                Primary Mood: {data.latest_emotion || "Detected"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Scores Card */}
        <div className="glass-card rounded-3xl p-8 flex flex-col justify-between hover:shadow-2xl transition-all duration-500 border-white/40">
          <div>
            <div className="flex items-center gap-2 text-primary mb-6">
              <Brain className="h-5 w-5" />
              <span className="font-semibold tracking-wide uppercase text-xs">Current Mind State</span>
            </div>
            
            <div className="space-y-8">
              <div className="group relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Rumination Level</span>
                    <span className="text-[10px] text-primary/60 font-medium">Repetitive negative thoughts</span>
                  </div>
                  <span className="text-2xl font-display font-bold text-foreground">{data.latest_rumination}/10</span>
                </div>
                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-calm via-primary to-warmth transition-all duration-1000 ease-out"
                    style={{ width: `${data.latest_rumination * 10}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                  Score of {data.latest_rumination}: {data.latest_rumination > 7 ? 
                    "You might be overthinking. Try a breathing exercise to reset." : 
                    data.latest_rumination > 4 ? "A balanced level of reflection. Stay mindful." : 
                    "Your mind is remarkably calm and clear."}
                </p>
              </div>

              <div className="group relative">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Emotion Clarity</span>
                    <span className="text-[10px] text-primary/60 font-medium">Understanding your feelings</span>
                  </div>
                  <span className="text-2xl font-display font-bold text-foreground">{data.latest_clarity}/10</span>
                </div>
                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-warmth via-calm to-primary transition-all duration-1000 ease-out"
                    style={{ width: `${data.latest_clarity * 10}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-muted-foreground/80 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                   Score of {data.latest_clarity}: {data.latest_clarity > 7 ? 
                    "You have a deep understanding of your emotions right now." : 
                    data.latest_clarity > 4 ? "You're starting to find clarity. Keep sharing." : 
                    "Emotions feel a bit cloudy. That's okay, we'll work through it."}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-primary/70">
              <Heart className="h-4 w-4" />
              <span>Personalized Insight</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">MindMate AI</span>
          </div>
        </div>

        {/* Emotion Distribution (Pie Chart) */}
        <div className="glass-card rounded-3xl p-8 transition-all duration-500 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="font-semibold tracking-wide uppercase text-xs">Emotion Landscape</span>
            </div>
            {activePieIndex !== null && (
               <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 rounded-full text-primary animate-in fade-in zoom-in duration-300">
                {data.emotions[activePieIndex].name}
              </span>
            )}
          </div>
          <div className="h-[240px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.emotions}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={8}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  animationBegin={0}
                  animationDuration={1500}
                >
                  {data.emotions.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke="none"
                      style={{
                        filter: activePieIndex === index ? `drop-shadow(0 0 8px ${COLORS[index % COLORS.length]}80)` : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-primary/10 animate-in fade-in zoom-in duration-200">
                          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tight">{payload[0].name}</p>
                          <p className="text-lg font-display text-foreground">{payload[0].value} <span className="text-xs text-muted-foreground font-normal">occurrences</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-[11px] font-medium text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {activePieIndex === null && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <p className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">Mood</p>
                <p className="text-sm font-bold text-foreground/30">Ratio</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Analysis (Line Chart) */}
      <div className="glass-card rounded-3xl p-8 hover:shadow-xl transition-all duration-500">
        <div className="flex items-center gap-2 text-primary mb-8">
          <TrendingUp className="h-5 w-5" />
          <span className="font-semibold tracking-wide uppercase text-xs">Mental Journey Trends</span>
        </div>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                domain={[0, 10]}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.9)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" height={40} />
              <Line 
                type="monotone" 
                dataKey="rumination" 
                stroke="oklch(0.55 0.12 160)" 
                strokeWidth={4}
                dot={{ r: 4, fill: 'oklch(0.55 0.12 160)', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                name="Rumination"
                animationDuration={2000}
              />
              <Line 
                type="monotone" 
                dataKey="clarity" 
                stroke="oklch(0.65 0.08 220)" 
                strokeWidth={4}
                dot={{ r: 4, fill: 'oklch(0.65 0.08 220)', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8, strokeWidth: 0 }}
                name="Clarity"
                animationDuration={2500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
