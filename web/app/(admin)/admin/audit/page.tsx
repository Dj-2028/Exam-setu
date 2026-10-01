"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import {
  Shield,
  Search,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
  RefreshCw,
} from "lucide-react";

interface AuditEntry {
  id: string;
  sequence_number: number;
  action: string;
  actor_id: string | null;
  actor_role: string;
  payload: Record<string, unknown>;
  previous_hash: string;
  entry_hash: string;
  created_at: string;
}

const actionIcons: Record<string, typeof Shield> = {
  "mark.saved": CheckCircle,
  "evaluation.submitted": CheckCircle,
  "flag.raised": AlertTriangle,
  "moderation.reconciled": Shield,
};

const actionColors: Record<string, string> = {
  "mark.saved": "text-emerald-500",
  "evaluation.submitted": "text-primary",
  "flag.raised": "text-amber-500",
  "moderation.reconciled": "text-blue-500",
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [searchAction, setSearchAction] = useState("");

  const fetchAuditData = useCallback(async () => {
    setLoading(true);
    try {
      const url = searchAction.trim() ? `/audit?action=${encodeURIComponent(searchAction.trim())}` : "/audit";
      const [entriesRes, verifyRes] = await Promise.allSettled([
        api.get<{ items: AuditEntry[] }>(url),
        api.get<{ valid: boolean }>("/audit/verify"),
      ]);

      if (entriesRes.status === "fulfilled") {
        setEntries(entriesRes.value.items || []);
      } else {
        setEntries([]);
      }

      if (verifyRes.status === "fulfilled") {
        setChainValid(verifyRes.value.valid);
      } else {
        setChainValid(null);
      }
    } catch {
      setEntries([]);
      setChainValid(null);
    } finally {
      setLoading(false);
    }
  }, [searchAction]);

  useEffect(() => {
    fetchAuditData();
  }, [fetchAuditData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Audit Trail</h1>
          {chainValid !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
                chainValid
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {chainValid ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Chain Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Chain Broken
                </>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAuditData()}
            className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
            title="Refresh Audit Log"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filter by action..."
              value={searchAction}
              onChange={(e) => setSearchAction(e.target.value)}
              className="rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
            />
          </div>
        </div>
      </div>

      {/* Chain visualization summary */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <LinkIcon className="h-4 w-4 text-primary shrink-0" />
          <span>
            Every platform action is cryptographically linked in a <strong className="text-foreground">SHA-256 hash chain</strong>.
            Each entry links to the previous via its hash, ensuring full auditability and anti-tamper security.
          </span>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={8} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon="🔗"
          title="Audit trail empty"
          description="Actions will be recorded here as evaluations, marks, flags, and moderation decisions are made."
        />
      ) : (
        <div className="space-y-2">
          {entries.map((entry, idx) => {
            const Icon = actionIcons[entry.action] || Shield;
            const color = actionColors[entry.action] || "text-muted-foreground";

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow text-xs"
              >
                <div className="flex flex-col items-center gap-1 shrink-0 mt-0.5">
                  <div className={cn("p-1.5 rounded-md bg-muted", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground">
                      {entry.action}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      #{entry.sequence_number}
                    </span>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      Role: {entry.actor_role}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono truncate">
                    Entry: {entry.entry_hash.slice(0, 16)}…
                    <span className="text-muted-foreground/50 mx-1.5">← Prev:</span>
                    {entry.previous_hash.slice(0, 16)}…
                  </div>
                </div>

                <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                  {new Date(entry.created_at).toLocaleString("en-IN")}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
