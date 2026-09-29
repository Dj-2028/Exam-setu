"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, RefreshCw, Eye } from "lucide-react";

interface Script {
  id: string;
  barcode: string;
  page_count: number;
  status: string;
  processing_error: string | null;
  created_at: string;
}

interface ScriptListProps {
  paperId: string;
  refreshKey?: number;
}

const statusMap: Record<string, string> = {
  uploaded: "pending",
  splitting: "in_progress",
  cleaning: "in_progress",
  segmenting: "in_progress",
  detecting: "in_progress",
  transcribing: "in_progress",
  ready: "completed",
  assigned: "completed",
  evaluation_in_progress: "in_progress",
  evaluated: "completed",
  in_moderation: "in_moderation",
  finalized: "finalized",
};

export function ScriptList({ paperId, refreshKey }: ScriptListProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchScripts = async () => {
    setLoading(true);
    try {
      const data = await api.get<{
        items: Script[];
        total: number;
      }>(`/scripts?paper_id=${paperId}&page_size=50`);
      setScripts(data.items);
      setTotal(data.total);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, [paperId, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <EmptyState
        icon="📄"
        title="No scripts uploaded"
        description="Upload PDF answer scripts to start processing."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {total} script{total !== 1 ? "s" : ""}
        </span>
        <button
          onClick={fetchScripts}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Barcode
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Pages
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Uploaded
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {scripts.map((script) => (
              <tr
                key={script.id}
                className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono text-xs font-medium">
                  {script.barcode}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {script.page_count || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge
                      status={
                        (statusMap[script.status] || "pending") as
                          | "pending"
                          | "in_progress"
                          | "completed"
                          | "finalized"
                          | "in_moderation"
                          | "flagged"
                      }
                    />
                    {script.processing_error && (
                      <span
                        className="text-xs text-destructive truncate max-w-[150px]"
                        title={script.processing_error}
                      >
                        {script.processing_error}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {new Date(script.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    title="View details"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
