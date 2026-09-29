"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Shield,
  Sparkles,
  Bell,
  Globe,
  Database,
  Save,
  Check,
} from "lucide-react";

type Section = "general" | "ai" | "notifications" | "security";

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("general");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    { id: "general" as Section, label: "General", icon: Settings },
    { id: "ai" as Section, label: "AI Settings", icon: Sparkles },
    { id: "notifications" as Section, label: "Notifications", icon: Bell },
    { id: "security" as Section, label: "Security", icon: Shield },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
            saved
              ? "bg-success text-success-foreground"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                section === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-xl border border-border bg-card p-6">
          {section === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-4">
                  General Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      System Name
                    </label>
                    <input
                      type="text"
                      defaultValue="ExamSetu AI"
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Default Language
                    </label>
                    <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="en">English</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Mark Increment
                    </label>
                    <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="0.5">0.5</option>
                      <option value="1">1</option>
                      <option value="0.25">0.25</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "ai" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-4">
                  AI Configuration
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Enable AI Suggestions
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Show AI score suggestions to examiners
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Auto-request Suggestions
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Automatically fetch AI suggestions when starting evaluation
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      AI Provider
                    </label>
                    <select className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="gemini">Gemini (OCR + Vision)</option>
                      <option value="groq">Groq (Scoring)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">
                      Anomaly Threshold
                    </label>
                    <input
                      type="number"
                      defaultValue={0.5}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Examiners above this score will be flagged for review (0–1)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-foreground mb-4">
                Notification Preferences
              </h2>
              <div className="space-y-3">
                {[
                  { label: "Flag raised", desc: "When a new flag is created" },
                  { label: "Evaluation submitted", desc: "When an examiner submits" },
                  { label: "Moderation needed", desc: "When marks diverge significantly" },
                  { label: "Export ready", desc: "When an export file is generated" },
                  { label: "Anomaly detected", desc: "When an examiner is flagged" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-foreground mb-4">
                Security & Audit
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Audit Trail
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SHA-256 hash chain with Ed25519 signatures
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Role-Based Access
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Firebase Auth with custom claims (RBAC)
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Session Timeout
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <select className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
