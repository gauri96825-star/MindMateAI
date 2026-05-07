import { useState, useRef, useEffect } from "react";
import { Send, Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/components/ChatMessage";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  getConversations,
  createConversation as apiCreateConversation,
  deleteConversation as apiDeleteConversation,
  sendChatMessage,
  getMessages,
} from "@/lib/api";
import type { Conversation, Message } from "@/lib/api";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hi there 💚 I'm MindMate, your mental wellness companion. I'm here to listen and support you. How are you feeling today?",
};

// Fallback responses when backend is unreachable
const FALLBACK_RESPONSES = [
  "I hear you, and I want you to know that your feelings are completely valid. It takes courage to share what you're going through. Would you like to explore what's behind these feelings?",
  "Thank you for opening up. It sounds like you're carrying a lot right now. Remember, it's okay to feel this way. What do you think might help you feel a bit lighter today?",
  "I appreciate you sharing that with me. Emotions can be complex and sometimes overwhelming. Let's take a moment — would a breathing exercise help right now, or would you prefer to keep talking?",
  "That sounds really challenging. You're doing well by acknowledging how you feel — that's an important step. What has helped you cope with similar feelings in the past?",
  "I'm here with you. It's completely normal to feel this way sometimes. Would you like to try journaling about this? Writing can often help us understand our feelings better.",
  "Your wellbeing matters, and I'm glad you're taking time to reflect on your emotions. What's one small thing you could do for yourself right now to feel a little better?",
];

interface LocalConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<LocalConversation[]>([
    { id: "local-1", title: "Welcome", messages: [WELCOME_MESSAGE], createdAt: new Date() },
  ]);
  const [activeConvId, setActiveConvId] = useState("local-1");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages]);

  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load conversations from backend on mount
  useEffect(() => {
    // We wait for Clerk user to be defined
    if (!user) {
      // If we've waited a while and still no user, stop loading (might be public)
      const timer = setTimeout(() => setIsInitialLoading(false), 3000);
      return () => clearTimeout(timer);
    }
    
    (async () => {
      setIsInitialLoading(true);
      try {
        const serverConvs = await getConversations();
        if (serverConvs.length > 0) {
          const loaded: LocalConversation[] = serverConvs.map((c) => ({
            id: c.id,
            title: c.title,
            messages: [WELCOME_MESSAGE],
            createdAt: new Date(c.created_at),
          }));
          setConversations(loaded);
          setActiveConvId(loaded[0].id);

          // Load messages for the first conversation
          const msgs = await getMessages(loaded[0].id);
          if (msgs.length > 0) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === loaded[0].id ? { ...c, messages: msgs } : c
              )
            );
          }
        }
      } catch (err) {
        console.error("Failed to load chats:", err);
      } finally {
        setIsInitialLoading(false);
      }
    })();
  }, [user]);

  // Load messages when switching conversations
  useEffect(() => {
    if (!activeConvId || activeConvId.startsWith("local-")) return;
    (async () => {
      try {
        const msgs = await getMessages(activeConvId);
        if (msgs.length > 0) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === activeConvId ? { ...c, messages: msgs } : c
            )
          );
        }
      } catch {
        // ignore
      }
    })();
  }, [activeConvId]);

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Please sign in to use the chat.</p>
        <Link to="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || !activeConversation) return;

    const userMessage: Message = { role: "user", content: input.trim() };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId
          ? {
              ...c,
              messages: [...c.messages, userMessage],
              title: c.messages.length <= 1 ? input.trim().slice(0, 30) + "..." : c.title,
            }
          : c
      )
    );
    const userInput = input.trim();
    setInput("");
    setIsTyping(true);
    inputRef.current?.focus();

    try {
      const aiText = await sendChatMessage(
        activeConvId,
        userInput,
        activeConversation.messages
      );

      const aiResponse: Message = { role: "assistant", content: aiText };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, messages: [...c.messages, aiResponse] } : c
        )
      );
    } catch {
      // Fallback when backend is down
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 800));
      const aiResponse: Message = {
        role: "assistant",
        content: FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)],
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConvId ? { ...c, messages: [...c.messages, aiResponse] } : c
        )
      );
    }

    setIsTyping(false);
  };

  const handleCreateConversation = async () => {
    try {
      const newConv = await apiCreateConversation();
      const local: LocalConversation = {
        id: newConv.id,
        title: newConv.title || "New chat",
        messages: [WELCOME_MESSAGE],
        createdAt: new Date(newConv.created_at),
      };
      setConversations((prev) => [local, ...prev]);
      setActiveConvId(local.id);
    } catch {
      // Fallback: create local conversation
      const id = `local-${Date.now()}`;
      const newConv: LocalConversation = {
        id,
        title: "New chat",
        messages: [WELCOME_MESSAGE],
        createdAt: new Date(),
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConvId(id);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      if (!id.startsWith("local-")) {
        await apiDeleteConversation(id);
      }
    } catch {
      // ignore server errors
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) setActiveConvId(remaining[0].id);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col border-r bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-72" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex items-center justify-between border-b p-3">
          <span className="text-sm font-medium text-sidebar-foreground">Conversations</span>
          <Button variant="ghost" size="icon" onClick={handleCreateConversation} className="h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setActiveConvId(conv.id)}
              className={cn(
                "group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                activeConvId === conv.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{conv.title}</span>
              {conversations.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }}
                  className="hidden text-muted-foreground hover:text-destructive group-hover:block"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b px-4 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>
          <span className="text-sm font-medium text-foreground">
            {activeConversation?.title || "Chat"}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto bg-muted/30">
          {activeConversation?.messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} />
          ))}
          {isTyping && (
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                </div>
              </div>
              <span className="text-xs text-muted-foreground">MindMate is thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t bg-card p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share what's on your mind..."
              className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isTyping}
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            MindMate AI provides emotional support, not professional medical advice.
          </p>
        </div>
      </div>
    </div>
  );
}
