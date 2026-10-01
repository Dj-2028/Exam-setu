"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, Scale, ArrowRight, Check, X, RefreshCw, AlertCircle } from "lucide-react";

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

interface Examiner {
  id: string;
  name: string;
  email: string;
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
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Route Modal
  const [routeCaseId, setRouteCaseId] = useState<string | null>(null);
  const [selectedExaminerId, setSelectedExaminerId] = useState("");
  const [routingSubmitting, setRoutingSubmitting] = useState(false);

  // Reconcile Modal
  const [reconcileCaseId, setReconcileCaseId] = useState<ModerationCase | null>(null);
  const [reconcileMethod, setReconcileMethod] = useState<"average" | "higher" | "manual">("average");
  const [finalScore, setFinalScore] = useState<number>(0);
  const [reconcileNote, setReconcileNote] = useState("");
  const [reconcileSubmitting, setReconcileSubmitting] = useState(false);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const data = await api.get<{ items: ModerationCase[] }>(`/moderation${params}`);
      setCases(data.items || []);

      // Load examiners for routing
      const usersRes = await api.get<{ items: Examiner[] }>("/users?role=examiner");
      const list = usersRes.items || [];
      setExaminers(list);
      if (list.length > 0 && !selectedExaminerId) {
        setSelectedExaminerId(list[0].id);
      }
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to load moderation cases.");
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [filter, selectedExaminerId]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeCaseId || !selectedExaminerId) return;
    setRoutingSubmitting(true);
    try {
      await api.post(`/moderation/${routeCaseId}/route`, {
        examiner_id: selectedExaminerId,
      });
      setRouteCaseId(null);
      await fetchCases();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Routing failed");
    } finally {
      setRoutingSubmitting(false);
    }
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reconcileCaseId) return;
    setReconcileSubmitting(true);
    try {
      await api.post(`/moderation/${reconcileCaseId.id}/reconcile`, {
        final_total: Number(finalScore),
        reconciliation_method: reconcileMethod,
        reconciliation_note: reconcileNote.trim() || null,
      });
      setReconcileCaseId(null);
      await fetchCases();
    } catch (err: any) {
      alert(err?.error?.message || err?.message || "Reconciliation failed");
    } finally {
      setReconcileSubmitting(false);
    }
  };

  const openReconcileModal = (c: ModerationCase) => {
    setReconcileCaseId(c);
    if (c.secondary_total !== null) {
      const avg = (c.primary_total + c.secondary_total) / 2;
      setFinalScore(Math.round(avg * 10) / 10);
    } else {
      setFinalScore(c.primary_total);
    }
    setReconcileMethod("average");
    setReconcileNote("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Moderation & Reconciliation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage second-marking workflows and resolve marking score discrepancies
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCases()}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {[
              { id: "all", label: "All" },
              { id: "pending_routing", label: "Pending Routing" },
              { id: "pending_reconciliation", label: "Reconcile" },
              { id: "reconciled", label: "Reconciled" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  filter === f.id
                    ? "bg-card text-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
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
      ) : cases.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="No moderation cases"
          description="Cases appear when score deviations exceed the moderation threshold."
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
                    <span className="text-xs font-mono font-bold text-foreground">
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
                    <span>Risk Score: <strong>{Math.round(c.risk_score * 100)}%</strong></span>
                    <span className="flex items-center gap-1">
                      1st Eval: <strong className="text-foreground">{c.primary_total}</strong>
                      {c.secondary_total !== null && (
                        <>
                          <ArrowRight className="h-3 w-3" />
                          2nd Eval: <strong className="text-foreground">{c.secondary_total}</strong>
                        </>
                      )}
                    </span>
                    {c.final_total !== null && (
                      <span className="flex items-center gap-1 font-medium">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Final: <strong className="text-emerald-600 dark:text-emerald-400">{c.final_total}</strong>
                        <span className="capitalize text-muted-foreground">({c.reconciliation_method})</span>
                      </span>
                    )}
                  </div>
                </div>

                {c.status === "pending_routing" && (
                  <button
                    onClick={() => setRouteCaseId(c.id)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 shadow-sm"
                  >
                    Route to Examiner
                  </button>
                )}
                {c.status === "pending_reconciliation" && (
                  <button
                    onClick={() => openReconcileModal(c)}
                    className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-medium shadow-sm hover:bg-amber-600"
                  >
                    Reconcile Score
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Route Modal */}
      {routeCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Route to Secondary Examiner</h2>
              <button onClick={() => setRouteCaseId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRouteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Select Secondary Examiner</label>
                <select
                  value={selectedExaminerId}
                  onChange={(e) => setSelectedExaminerId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {examiners.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name || ex.email} ({ex.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRouteCaseId(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={routingSubmitting}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {routingSubmitting ? "Routing..." : "Confirm Route"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {reconcileCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Reconcile Discrepant Score</h2>
              <button onClick={() => setReconcileCaseId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border border-border text-xs">
              <div>Primary Score: <strong>{reconcileCaseId.primary_total}</strong></div>
              <div>Secondary Score: <strong>{reconcileCaseId.secondary_total ?? "—"}</strong></div>
            </div>

            <form onSubmit={handleReconcileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Reconciliation Method</label>
                <select
                  value={reconcileMethod}
                  onChange={(e) => {
                    const m = e.target.value as any;
                    setReconcileMethod(m);
                    if (m === "average" && reconcileCaseId.secondary_total !== null) {
                      setFinalScore((reconcileCaseId.primary_total + reconcileCaseId.secondary_total) / 2);
                    } else if (m === "higher" && reconcileCaseId.secondary_total !== null) {
                      setFinalScore(Math.max(reconcileCaseId.primary_total, reconcileCaseId.secondary_total));
                    }
                  }}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="average">Mathematical Average</option>
                  <option value="higher">Take Higher Score</option>
                  <option value="manual">Manual Score Override</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Final Reconciled Score *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={finalScore}
                  onChange={(e) => setFinalScore(Number(e.target.value))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Controller Note</label>
                <textarea
                  rows={2}
                  value={reconcileNote}
                  onChange={(e) => setReconcileNote(e.target.value)}
                  placeholder="Reason for reconciliation decision..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReconcileCaseId(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reconcileSubmitting}
                  className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-xs font-medium shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {reconcileSubmitting ? "Saving..." : "Save Reconciliation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
