"use client";

import { RoleGuard } from "@/lib/auth/RoleGuard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "next-themes";
import { SaveStatus } from "@/components/shared/SaveStatus";
import { Sun, Moon, Monitor, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Examiner layout: top bar only (focused on the task),
 * with a drawer for the queue on tablets.
 */
export default function ExaminerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["examiner"]}>
      <ExaminerShell>{children}</ExaminerShell>
    </RoleGuard>
  );
}

function ExaminerShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu size={18} />
          </button>
          <Link
            href="/examiner"
            className="text-sm font-bold text-primary flex items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              ES
            </span>
            ExamSetu AI
          </Link>
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Examiner
          </span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Theme */}
          <div className="hidden sm:flex gap-0.5 rounded-lg bg-muted p-0.5">
            <button
              onClick={() => setTheme("light")}
              className={`rounded-md p-1.5 transition-colors ${theme === "light" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sun size={14} />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`rounded-md p-1.5 transition-colors ${theme === "dark" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Moon size={14} />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`rounded-md p-1.5 transition-colors ${theme === "system" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Monitor size={14} />
            </button>
          </div>

          <button
            onClick={signOut}
            className="rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="absolute left-0 top-14 bottom-0 w-72 bg-card border-r border-border p-4 shadow-lg">
            <Link
              href="/examiner"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              📋 My Sheets
            </Link>
            <Link
              href="/examiner/second-evaluations"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              👥 Second Evaluations
            </Link>
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="mx-auto max-w-7xl">{children}</main>
    </div>
  );
}
