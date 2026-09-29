"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/Skeleton";
import {
  Shield,
  Hash,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  AlertTriangle,
  Link as LinkIcon,
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
  "mark.saved": "text-success",
  "evaluation.submitted": "text-primary",
  "flag.raised": "text-warning",
  "moderation.reconciled": "text-info",
};

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [searchAction, setSearchAction] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // For now, show placeholder since audit endpoints are service-only
        setEntries([]);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [searchAction]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Audit Trail</h1>
          {chainValid !== null && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                chainValid
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {chainValid ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Chain Verified
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Chain Broken
                </>
              )}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter by action..."
            value={searchAction}
            onChange={(e) => setSearchAction(e.target.value)}
            className="rounded-lg border border-border bg-card pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
          />
        </div>
      </div>

      {/* Chain visualization */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <LinkIcon className="h-4 w-4 text-primary" />
          <span>
            Every action is recorded in a <strong className="text-foreground">SHA-256 hash chain</strong>.
            Each entry links to the previous via its hash, making the trail tamper-evident.
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
        <div className="space-y-1">
          {entries.map((entry, idx) => {
            const Icon = actionIcons[entry.action] || Shield;
            const color = actionColors[entry.action] || "text-muted-foreground";

            return (
              <div
                key={entry.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {/* Chain link indicator */}
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className={cn("p-1.5 rounded-md bg-muted", color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {idx < entries.length - 1 && (
                    <div className="w-px h-4 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground">
                      {entry.action}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                      #{entry.sequence_number}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {entry.actor_role}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono truncate">
                    {entry.entry_hash.slice(0, 16)}…
                    <span className="text-muted-foreground/50 mx-1">←</span>
                    {entry.previous_hash.slice(0, 16)}…
                  </div>
                </div>

                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(entry.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
