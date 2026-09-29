"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, Play, Eye, Clock } from "lucide-react";
import Link from "next/link";

interface Evaluation {
  id: string;
  script_id: string;
  evaluation_type: string;
  status: string;
  total_marks: number | null;
  total_time_seconds: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

const statusToVariant: Record<string, string> = {
  assigned: "pending",
  in_progress: "in_progress",
  completed: "completed",
  submitted: "finalized",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function SheetQueue() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      try {
        const params = filter !== "all" ? `?status=${filter}` : "";
        const data = await api.get<{ items: Evaluation[] }>(
          `/evaluations/my-queue${params}`
        );
        setEvaluations(data.items);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {[
          { id: "all", label: "All" },
          { id: "assigned", label: "Pending" },
          { id: "in_progress", label: "In Progress" },
          { id: "submitted", label: "Completed" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              filter === f.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {evaluations.length === 0 ? (
        <EmptyState
          icon="📋"
          title={
            filter === "all"
              ? "No sheets assigned"
              : `No ${filter.replace("_", " ")} sheets`
          }
          description="Sheets will appear here when assigned by an admin."
        />
      ) : (
        <div className="space-y-2">
          {evaluations.map((eval_) => (
            <div
              key={eval_.id}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              {/* Status */}
              <StatusBadge
                status={
                  (statusToVariant[eval_.status] || "pending") as
                    | "pending"
                    | "in_progress"
                    | "completed"
                    | "finalized"
                }
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Script #{eval_.script_id.slice(0, 8)}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground capitalize">
                    {eval_.evaluation_type} evaluation
                  </span>
                  {eval_.total_time_seconds > 0 && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(eval_.total_time_seconds)}
                    </span>
                  )}
                  {eval_.total_marks !== null && (
                    <span className="text-xs font-medium text-foreground">
                      Score: {eval_.total_marks}
                    </span>
                  )}
                </div>
              </div>

              {/* Action */}
              {eval_.status === "assigned" && (
                <Link
                  href={`/examiner/evaluate/${eval_.id}`}
                  className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Play className="h-4 w-4" />
                  Start
                </Link>
              )}
              {eval_.status === "in_progress" && (
                <Link
                  href={`/examiner/evaluate/${eval_.id}`}
                  className="flex items-center gap-1.5 rounded-lg bg-warning/10 border border-warning/30 px-4 py-2 text-sm font-medium text-warning hover:bg-warning/20 transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Continue
                </Link>
              )}
              {eval_.status === "submitted" && (
                <Link
                  href={`/examiner/evaluate/${eval_.id}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
