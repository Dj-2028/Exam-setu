"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Settings,
  Shield,
  Sparkles,
  Bell,
  Save,
  Check,
} from "lucide-react";

type Section = "general" | "ai" | "notifications" | "security";

interface SystemSettings {
  systemName: string;
  defaultLang: string;
  markIncrement: number;
  enableAISuggestions: boolean;
  autoRequestSuggestions: boolean;
  aiProvider: string;
  anomalyThreshold: number;
  notifyFlagRaised: boolean;
  notifyEvaluationSubmitted: boolean;
  notifyModerationNeeded: boolean;
  sessionTimeout: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  systemName: "ExamSetu AI",
  defaultLang: "en",
  markIncrement: 0.5,
  enableAISuggestions: true,
  autoRequestSuggestions: false,
  aiProvider: "gemini",
  anomalyThreshold: 0.5,
  notifyFlagRaised: true,
  notifyEvaluationSubmitted: true,
  notifyModerationNeeded: true,
  sessionTimeout: 60,
};

export default function SettingsPage() {
  const [section, setSection] = useState<Section>("general");
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("examsetu_settings");
      if (stored) {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      }
    } catch {
      // Use defaults
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("examsetu_settings", JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Failed to save settings to localStorage.");
    }
  };

  const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sections = [
    { id: "general" as Section, label: "General", icon: Settings },
    { id: "ai" as Section, label: "AI Settings", icon: Sparkles },
    { id: "notifications" as Section, label: "Notifications", icon: Bell },
    { id: "security" as Section, label: "Security & Access", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Platform Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure system parameters, AI scoring rules, and security controls
          </p>
        </div>
        <button
          onClick={handleSave}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all shadow-sm",
            saved
              ? "bg-emerald-600 text-white"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" />
              Settings Saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full sm:w-48 shrink-0 space-y-1">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={cn(
                "flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-left",
                section === s.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <s.icon className="h-4 w-4 shrink-0" />
              {s.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm text-xs">
          {section === "general" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-foreground mb-4">
                  General System Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      System Title
                    </label>
                    <input
                      type="text"
                      value={settings.systemName}
                      onChange={(e) => updateSetting("systemName", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Default Platform Language
                    </label>
                    <select
                      value={settings.defaultLang}
                      onChange={(e) => updateSetting("defaultLang", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="en">English (US/UK)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Default Marking Increment
                    </label>
                    <select
                      value={settings.markIncrement}
                      onChange={(e) => updateSetting("markIncrement", Number(e.target.value))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value={0.5}>0.5 Marks (Default)</option>
                      <option value={1.0}>1.0 Marks</option>
                      <option value={0.25}>0.25 Marks</option>
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
                  AI & Model Scoring Rules
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        Enable AI Score Suggestions
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Provide non-binding AI score band recommendations to examiners
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.enableAISuggestions}
                      onChange={(e) => updateSetting("enableAISuggestions", e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div>
                      <p className="font-semibold text-foreground">
                        Auto-request AI Suggestions
                      </p>
                      <p className="text-muted-foreground mt-0.5">
                        Automatically query LLM scoring models on opening each question
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoRequestSuggestions}
                      onChange={(e) => updateSetting("autoRequestSuggestions", e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Primary AI Model Integration
                    </label>
                    <select
                      value={settings.aiProvider}
                      onChange={(e) => updateSetting("aiProvider", e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="gemini">Google Gemini 1.5 Flash (Vision & OCR)</option>
                      <option value="groq">Groq Llama-3 (Fast Scoring)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-foreground block mb-1">
                      Examiner Anomaly Sensitivity Threshold (0.0 – 1.0)
                    </label>
                    <input
                      type="number"
                      value={settings.anomalyThreshold}
                      onChange={(e) => updateSetting("anomalyThreshold", Number(e.target.value))}
                      min={0}
                      max={1}
                      step={0.1}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {section === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-foreground mb-4">
                System Alerts & Notifications
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">Flag Raised Alerts</p>
                    <p className="text-muted-foreground">Notify controllers when examiner raises a flag</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyFlagRaised}
                    onChange={(e) => updateSetting("notifyFlagRaised", e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">Evaluation Completion Alerts</p>
                    <p className="text-muted-foreground">Notify when examiner submits an answer script</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyEvaluationSubmitted}
                    onChange={(e) => updateSetting("notifyEvaluationSubmitted", e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="font-semibold text-foreground">Moderation Queue Trigger</p>
                    <p className="text-muted-foreground">Notify when double-marked scores diverge</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notifyModerationNeeded}
                    onChange={(e) => updateSetting("notifyModerationNeeded", e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
          )}

          {section === "security" && (
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-foreground mb-4">
                Security & Access Control
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      Cryptographic Audit Trail
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      SHA-256 tamper-evident hash chain with Ed25519 signatures
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Enforced
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      Authentication Provider
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Clerk Auth with Role-Based Access Control (RBAC)
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    Enforced
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div>
                    <p className="font-semibold text-foreground">
                      Session Inactivity Timeout
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Auto-logout after period of inactivity
                    </p>
                  </div>
                  <select
                    value={settings.sessionTimeout}
                    onChange={(e) => updateSetting("sessionTimeout", Number(e.target.value))}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour (Default)</option>
                    <option value={120}>2 hours</option>
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
