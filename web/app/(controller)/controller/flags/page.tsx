"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, AlertTriangle, Check, X, ChevronUp } from "lucide-react";

interface FlagItem {
  id: string;
  flag_type: string;
  severity: string;
  status: string;
  message: string;
  raised_by: string;
  created_at: string;
}

const severityStyles: Record<string, string> = {
  low: "bg-info/10 text-info border-info/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

const typeLabels: Record<string, string> = {
  blank_answer: "Blank Answer",
  skipped_question: "Skipped Question",
  missing_signature: "Missing Signature",
  diagram_missing: "Diagram Missing",
  examiner_outlier: "Examiner Outlier",
  uniform_marks: "Uniform Marks",
  fast_marking: "Fast Marking",
  ai_divergence: "AI Divergence",
  manual: "Manual Flag",
};

export default function FlagsPage() {
  const [flags, setFlags] = useState<FlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("open");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filter !== "all" ? `?status=${filter}` : "";
        const data = await api.get<{ items: FlagItem[] }>(
          `/flags${params}`
        );
        setFlags(data.items);
      } catch {
        setFlags([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Flags</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {["open", "acknowledged", "dismissed", "all"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                filter === f
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : flags.length === 0 ? (
        <EmptyState
          icon="🚩"
          title="No flags"
          description={
            filter === "open"
              ? "No open flags. The system will auto-detect anomalies."
              : "No flags match the current filter."
          }
        />
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={cn(
                    "h-5 w-5 shrink-0 mt-0.5",
                    flag.severity === "high"
                      ? "text-destructive"
                      : flag.severity === "medium"
                        ? "text-warning"
                        : "text-info"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {typeLabels[flag.flag_type] || flag.flag_type}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs font-medium",
                        severityStyles[flag.severity]
                      )}
                    >
                      {flag.severity}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      by {flag.raised_by}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.message}</p>
                  <span className="text-xs text-muted-foreground mt-1 block">
                    {new Date(flag.created_at).toLocaleString("en-IN")}
                  </span>
                </div>

                {flag.status === "open" && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-success hover:border-success/30 transition-colors"
                      title="Acknowledge"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-warning hover:border-warning/30 transition-colors"
                      title="Escalate"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
