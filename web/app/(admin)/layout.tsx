"use client";

import { RoleGuard } from "@/lib/auth/RoleGuard";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  LogOut,
  Users,
  BookOpen,
  ClipboardList,
  ScrollText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Admin layout: same structure as controller — collapsible sidebar + top bar.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["admin"]}>
      <AdminShell>{children}</AdminShell>
    </RoleGuard>
  );
}

const navItems = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/exams", label: "Exams & Papers", icon: BookOpen },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function AdminShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-200",
          sidebarCollapsed ? "w-16" : "w-60",
          "hidden lg:block"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          {!sidebarCollapsed && (
            <span className="text-sm font-bold text-primary">ExamSetu AI</span>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu size={16} />
          </button>
        </div>

        <nav className="mt-2 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                title={item.label}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <span className="text-sm font-bold text-primary">ExamSetu AI</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <nav className="mt-2 px-2 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div
        className={cn(
          "transition-all duration-200",
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu size={18} />
            </button>
            <span className="text-sm font-semibold text-foreground">Admin</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex gap-0.5 rounded-lg bg-muted p-0.5">
              <button onClick={() => setTheme("light")} className={`rounded-md p-1.5 transition-colors ${theme === "light" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Sun size={14} />
              </button>
              <button onClick={() => setTheme("dark")} className={`rounded-md p-1.5 transition-colors ${theme === "dark" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                <Moon size={14} />
              </button>
              <button onClick={() => setTheme("system")} className={`rounded-md p-1.5 transition-colors ${theme === "system" ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
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

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
