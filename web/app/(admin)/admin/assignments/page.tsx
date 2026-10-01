"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeleton";
import {
  UserPlus,
  ArrowRight,
  FileText,
  Users,
  Shuffle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

type Mode = "manual" | "auto";

interface Examiner {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}

interface Script {
  id: string;
  paper_id: string;
  barcode: string;
  status: string;
}

interface Evaluation {
  id: string;
  script_id: string;
  examiner_id: string;
  status: string;
}

export default function AssignmentsPage() {
  const [mode, setMode] = useState<Mode>("manual");
  
  // Data
  const [examiners, setExaminers] = useState<Examiner[]>([]);
  const [readyScripts, setReadyScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Manual Assignment selection
  const [selectedExaminerId, setSelectedExaminerId] = useState<string>("");
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  // Auto-Assignment Form state
  const [scriptsPerExaminer, setScriptsPerExaminer] = useState<number>(20);
  const [doubleMarking, setDoubleMarking] = useState<boolean>(false);
  const [randomize, setRandomize] = useState<boolean>(true);
  const [runningAuto, setRunningAuto] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch examiners
      const usersRes = await api.get<{ items: Examiner[] }>("/users?role=examiner");
      const activeExaminers = (usersRes.items || []).filter((u) => u.is_active);
      setExaminers(activeExaminers);
      if (activeExaminers.length > 0 && !selectedExaminerId) {
        setSelectedExaminerId(activeExaminers[0].id);
      }

      // Fetch unassigned scripts
      const scriptsRes = await api.get<{ items: Script[] }>("/scripts?status=ready");
      const ready = scriptsRes.items || [];
      setReadyScripts(ready);
      if (ready.length > 0 && !selectedScriptId) {
        setSelectedScriptId(ready[0].id);
      }
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to load assignment data.");
    } finally {
      setLoading(false);
    }
  }, [selectedExaminerId, selectedScriptId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleManualAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExaminerId || !selectedScriptId) {
      setError("Please select both an examiner and a script.");
      return;
    }
    setAssigning(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await api.post<Evaluation>("/evaluations", {
        script_id: selectedScriptId,
        examiner_id: selectedExaminerId,
        evaluation_type: "primary",
      });
      setSuccessMsg("Script successfully assigned!");
      await fetchData();
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  };

  const handleAutoAssign = async () => {
    if (examiners.length === 0) {
      setError("No active examiners available for auto-assignment.");
      return;
    }
    if (readyScripts.length === 0) {
      setError("No ready scripts available for auto-assignment.");
      return;
    }

    setRunningAuto(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let scriptsToAssign = [...readyScripts];
      if (randomize) {
        scriptsToAssign.sort(() => Math.random() - 0.5);
      }

      let assignedCount = 0;
      let exIdx = 0;

      for (const script of scriptsToAssign) {
        const examiner = examiners[exIdx % examiners.length];
        try {
          await api.post("/evaluations", {
            script_id: script.id,
            examiner_id: examiner.id,
            evaluation_type: "primary",
          });
          assignedCount++;
        } catch {
          // Ignore individual assignment conflicts
        }
        exIdx++;
        if (assignedCount >= scriptsPerExaminer * examiners.length) break;
      }

      setSuccessMsg(`Auto-assigned ${assignedCount} scripts across ${examiners.length} examiners.`);
      await fetchData();
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Auto-assignment completed with warnings.");
    } finally {
      setRunningAuto(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Script Assignments</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Distribute candidate scripts to examiners for evaluation
          </p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Assignment mode selector */}
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setMode("manual")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
            mode === "manual"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card hover:border-primary/30"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <UserPlus className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Manual Assignment
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select specific scripts and assign directly to chosen examiners
            </p>
          </div>
        </button>

        <button
          onClick={() => setMode("auto")}
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
            mode === "auto"
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border bg-card hover:border-primary/30"
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
            <Shuffle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Auto-Assignment
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically distribute scripts evenly across active examiners
            </p>
          </div>
        </button>
      </div>

      {/* Assignment workflow */}
      {loading ? (
        <ListSkeleton items={3} />
      ) : mode === "manual" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-foreground">
              Manual Assignment Form
            </h2>

            {examiners.length === 0 || readyScripts.length === 0 ? (
              <EmptyState
                icon="📋"
                title={examiners.length === 0 ? "No active examiners" : "No ready scripts"}
                description={
                  examiners.length === 0
                    ? "Invite examiners in User Management first."
                    : "Upload PDF scripts in Exams & Papers section."
                }
              />
            ) : (
              <form onSubmit={handleManualAssign} className="space-y-4 text-xs">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Select Examiner ({examiners.length} active)
                    </label>
                    <select
                      value={selectedExaminerId}
                      onChange={(e) => setSelectedExaminerId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {examiners.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name || ex.email} ({ex.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium mb-1.5 text-foreground">
                      Select Ready Script ({readyScripts.length} available)
                    </label>
                    <select
                      value={selectedScriptId}
                      onChange={(e) => setSelectedScriptId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {readyScripts.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.barcode} (ID: {s.id.slice(0, 8)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={assigning}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    {assigning ? "Assigning..." : "Assign Script"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-foreground">
              Auto-Assignment Configuration
            </h2>

            <div className="grid gap-3 sm:grid-cols-3 p-3 rounded-xl bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground">Active Examiners:</span>
                <span className="ml-2 font-bold text-foreground">{examiners.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Ready Scripts:</span>
                <span className="ml-2 font-bold text-foreground">{readyScripts.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Batch Capacity:</span>
                <span className="ml-2 font-bold text-foreground">
                  {examiners.length * scriptsPerExaminer}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <label className="text-muted-foreground font-medium">
                  Max scripts per examiner
                </label>
                <input
                  type="number"
                  value={scriptsPerExaminer}
                  onChange={(e) => setScriptsPerExaminer(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={100}
                  className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-2">
                <label className="text-muted-foreground font-medium">
                  Enable double marking (secondary evaluation)
                </label>
                <input
                  type="checkbox"
                  checked={doubleMarking}
                  onChange={(e) => setDoubleMarking(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center justify-between border-b border-border pb-2">
                <label className="text-muted-foreground font-medium">
                  Randomize assignment order across examiners
                </label>
                <input
                  type="checkbox"
                  checked={randomize}
                  onChange={(e) => setRandomize(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleAutoAssign}
                disabled={runningAuto || readyScripts.length === 0 || examiners.length === 0}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                <Shuffle className="h-4 w-4" />
                {runningAuto ? "Distributing..." : "Run Auto-Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
