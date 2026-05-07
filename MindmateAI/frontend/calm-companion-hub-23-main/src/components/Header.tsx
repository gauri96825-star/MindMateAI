import { Link, useLocation } from "react-router-dom";
import { Brain, MessageCircle, Wind, BookOpen, Music, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserButton } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";

export function Header() {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { to: "/chat", icon: MessageCircle, label: "Chat" },
    { to: "/breathe", icon: Wind, label: "Breathe" },
    { to: "/journal", icon: BookOpen, label: "Journal" },
    { to: "/wellness", icon: Music, label: "Wellness" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold font-[var(--font-display)] text-foreground">MindMate AI</span>
        </Link>

        {user && (
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to}>
                <Button
                  variant={isActive(item.to) ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* @ts-ignore - Clerk components can occasionally be null during initialization */}
              {UserButton && (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
              )}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-8 w-8"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && user && (
        <div className="border-t bg-card px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)}>
                <Button
                  variant={isActive(item.to) ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start gap-2"
                >
                  <item.icon className="h-4 w-4" /> {item.label}
                </Button>
              </Link>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { signOut(); setMobileOpen(false); }}
              className="w-full justify-start gap-2 text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
