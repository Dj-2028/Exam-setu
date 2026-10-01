"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, AlertTriangle, Check, X, ChevronUp, RefreshCw, AlertCircle } from "lucide-react";

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
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const data = await api.get<{ items: FlagItem[] }>(`/flags${params}`);
      setFlags(data.items || []);
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to load flags.");
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleResolveFlag = async (flagId: string, status: "acknowledged" | "dismissed" | "escalated") => {
    setActionLoading(flagId);
    try {
      await api.post(`/flags/${flagId}/resolve`, {
        status,
        resolution_note: `Action '${status}' taken by controller from dashboard.`,
      });
      await fetchFlags();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Failed to resolve flag");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Audit Flags</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor and resolve system-detected anomalies and examiner manual flags
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchFlags()}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {["open", "acknowledged", "dismissed", "all"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-3 py-1.5 capitalize font-medium transition-colors",
                  filter === f
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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
                    <span className="text-sm font-semibold text-foreground">
                      {typeLabels[flag.flag_type] || flag.flag_type}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                        severityStyles[flag.severity]
                      )}
                    >
                      {flag.severity}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      by {flag.raised_by}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{flag.message}</p>
                  <span className="text-[11px] text-muted-foreground mt-1 block font-mono">
                    {new Date(flag.created_at).toLocaleString("en-IN")}
                  </span>
                </div>

                {flag.status === "open" && (
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleResolveFlag(flag.id, "acknowledged")}
                      disabled={actionLoading === flag.id}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                      title="Acknowledge Flag"
                    >
                      <Check className="h-3.5 w-3.5" /> Acknowledge
                    </button>
                    <button
                      onClick={() => handleResolveFlag(flag.id, "dismissed")}
                      disabled={actionLoading === flag.id}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
                      title="Dismiss Flag"
                    >
                      <X className="h-3.5 w-3.5" /> Dismiss
                    </button>
                    <button
                      onClick={() => handleResolveFlag(flag.id, "escalated")}
                      disabled={actionLoading === flag.id}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-amber-600 hover:bg-amber-500/10 transition-colors disabled:opacity-50"
                      title="Escalate Flag"
                    >
                      <ChevronUp className="h-3.5 w-3.5" /> Escalate
                    </button>
                  </div>
                )}

                {flag.status !== "open" && (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-semibold capitalize text-muted-foreground">
                    {flag.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
