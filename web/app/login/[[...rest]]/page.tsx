"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";

export default function LoginPage() {
  const { state, role } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already signed in
  useEffect(() => {
    if (state === "signedIn" && role) {
      const homeMap: Record<string, string> = {
        examiner: "/examiner",
        controller: "/controller/dashboard",
        admin: "/admin/users",
      };
      router.replace(homeMap[role] || "/examiner");
    }
  }, [state, role, router]);

  const activeTheme = mounted ? theme : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 flex gap-1">
        <button
          onClick={() => setTheme("light")}
          className={`rounded-lg p-2 transition-colors ${
            activeTheme === "light"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Light"
        >
          <Sun size={16} />
        </button>
        <button
          onClick={() => setTheme("dark")}
          className={`rounded-lg p-2 transition-colors ${
            activeTheme === "dark"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Dark"
        >
          <Moon size={16} />
        </button>
        <button
          onClick={() => setTheme("system")}
          className={`rounded-lg p-2 transition-colors ${
            activeTheme === "system"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="System"
        >
          <Monitor size={16} />
        </button>
      </div>

      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <span className="text-xl font-bold">ES</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">ExamSetu AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-Assisted Evaluation Platform
        </p>
      </div>

      {/* Official Clerk Sign In */}
      <SignIn
        routing="path"
        path="/login"
        appearance={theme === "dark" ? dark : undefined}
      />

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-muted-foreground">
        AI suggests, the human decides, the system records everything.
      </p>
    </div>
  );
}
