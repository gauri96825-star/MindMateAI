import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Clerk JWT token to every request
api.interceptors.request.use(async (config) => {
  try {
    const clerk = typeof window !== 'undefined' ? (window as any).Clerk : null;
    
    // If Clerk is available but session is still loading, wait a bit
    if (clerk && !clerk.session && clerk.addListener && clerk.isReady) {
       await new Promise(resolve => {
         const unsubscribe = clerk.addListener(({ session }: any) => {
           if (session) {
             unsubscribe();
             resolve(true);
           }
         });
         // Timeout after 1 second to avoid excessive hanging
         setTimeout(resolve, 1000);
       });
    }

    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.warn("API Auth Interceptor Error:", err);
  }
  return config;
});

// ==================== Chat API ====================

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get("/conversations");
  return data.conversations || [];
}

export async function createConversation(): Promise<Conversation> {
  const { data } = await api.post("/conversations");
  return data;
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/conversations/${id}`);
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data.messages || [];
}

export async function sendChatMessage(
  conversationId: string,
  message: string,
  history: Message[]
): Promise<string> {
  const { data } = await api.post("/chat", {
    conversation_id: conversationId,
    message,
    history,
  });
  return data.response || "";
}

// ==================== Journal API ====================

export interface JournalEntry {
  id: string;
  content: string;
  mood: string;
  rumination_score?: number;
  emotion_label?: string;
  created_at: string;
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const { data } = await api.get("/journal");
  return data.entries || [];
}

export async function saveJournalEntry(
  content: string,
  mood: string
): Promise<JournalEntry> {
  const { data } = await api.post("/journal", { content, mood });
  return data;
}

// ==================== Analysis API ====================

export interface AnalysisResult {
  message: string;
  analysis: string;
  clean_score: number;
  clean_emotion: string;
}

export async function analyzeText(text: string): Promise<AnalysisResult> {
  const { data } = await api.post("/analyze", { text });
  return data;
}

export async function getHistory() {
  const { data } = await api.get("/history");
  return data.history || [];
}

// ==================== Wellness API ====================

export interface WellnessRecommendation {
  mood_summary: string;
  categories: Record<string, {
    title: string;
    artist: string;
    youtube_id: string;
    thumbnail_url: string;
  }[]>;
}

export async function getWellnessRecommendations(): Promise<WellnessRecommendation> {
  const { data } = await api.get("/wellness/recommendations");
  return data;
}

export default api;
