"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, Scale, ArrowRight, Check } from "lucide-react";

interface ModerationCase {
  id: string;
  script_id: string;
  risk_score: number;
  primary_total: number;
  secondary_total: number | null;
  status: string;
  final_total: number | null;
  reconciliation_method: string | null;
  created_at: string;
}

const statusVariant: Record<string, string> = {
  pending_routing: "pending",
  routed: "in_progress",
  second_in_progress: "in_progress",
  pending_reconciliation: "flagged",
  reconciled: "finalized",
};

export default function ModerationPage() {
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = filter !== "all" ? `?status=${filter}` : "";
        const data = await api.get<{ items: ModerationCase[] }>(
          `/moderation${params}`
        );
        setCases(data.items);
      } catch {
        setCases([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Moderation</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {[
            { id: "all", label: "All" },
            { id: "pending_routing", label: "Pending" },
            { id: "pending_reconciliation", label: "Reconcile" },
            { id: "reconciled", label: "Done" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="No moderation cases"
          description="Cases appear when mark deviations exceed the threshold."
        />
      ) : (
        <div className="space-y-2">
          {cases.map((c) => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-4">
                <Scale className="h-5 w-5 text-info shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      Script #{c.script_id.slice(0, 8)}
                    </span>
                    <StatusBadge
                      status={
                        (statusVariant[c.status] || "pending") as
                          | "pending"
                          | "in_progress"
                          | "completed"
                          | "finalized"
                          | "flagged"
                      }
                    />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Risk: {(c.risk_score * 100).toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1">
                      1st: <strong className="text-foreground">{c.primary_total}</strong>
                      {c.secondary_total !== null && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          2nd: <strong className="text-foreground">{c.secondary_total}</strong>
                        </>
                      )}
                    </span>
                    {c.final_total !== null && (
                      <span className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-success" />
                        Final: <strong className="text-success">{c.final_total}</strong>
                        <span className="capitalize">({c.reconciliation_method})</span>
                      </span>
                    )}
                  </div>
                </div>

                {c.status === "pending_routing" && (
                  <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                    Route
                  </button>
                )}
                {c.status === "pending_reconciliation" && (
                  <button className="rounded-lg bg-warning/10 border border-warning/30 px-3 py-1.5 text-xs font-medium text-warning hover:bg-warning/20 transition-colors">
                    Reconcile
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
