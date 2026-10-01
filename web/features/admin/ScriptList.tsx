"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Loader2, RefreshCw, Eye, X, AlertTriangle, Layers, RotateCcw } from "lucide-react";

interface Region {
  id: string;
  question_id: string | null;
  transcription: string;
  transcription_confidence: number;
  has_diagram: boolean;
  is_blank: boolean;
  order_index: number;
}

interface Page {
  id: string;
  page_number: number;
  width: number;
  height: number;
  regions: Region[];
}

interface ScriptDetail {
  id: string;
  paper_id: string;
  barcode: string;
  page_count: number;
  status: string;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
  pages: Page[];
}

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

  // Script Detail Modal
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);
  const [scriptDetail, setScriptDetail] = useState<ScriptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reprocessing, setReprocessing] = useState(false);

  const fetchScripts = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/scripts?page_size=50`;
      if (paperId && paperId !== "00000000-0000-0000-0000-000000000001") {
        url = `/scripts?paper_id=${paperId}&page_size=50`;
      }
      let data = await api.get<{
        items: Script[];
        total: number;
      }>(url);

      // Fallback: If filtered paper returned no scripts, load all scripts so uploads are always visible
      if ((!data.items || data.items.length === 0) && url.includes("paper_id=")) {
        data = await api.get<{
          items: Script[];
          total: number;
        }>(`/scripts?page_size=50`);
      }

      setScripts(data.items || []);
      setTotal(data.total || 0);
    } catch {
      // Ignore error
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  useEffect(() => {
    fetchScripts();
  }, [fetchScripts, refreshKey]);

  const handleViewScript = async (scriptId: string) => {
    setSelectedScriptId(scriptId);
    setDetailLoading(true);
    setScriptDetail(null);
    try {
      const data = await api.get<ScriptDetail>(`/scripts/${scriptId}`);
      setScriptDetail(data);
    } catch {
      // Handle
    } finally {
      setDetailLoading(false);
    }
  };

  const handleReprocess = async (scriptId: string) => {
    setReprocessing(true);
    try {
      await api.post(`/scripts/${scriptId}/reprocess`);
      await fetchScripts();
      if (selectedScriptId === scriptId) {
        await handleViewScript(scriptId);
      }
    } catch {
      // Handle error
    } finally {
      setReprocessing(false);
    }
  };

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
        <span className="text-xs text-muted-foreground font-medium">
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

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Barcode
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Pages
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Uploaded
              </th>
              <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {scripts.map((script) => (
              <tr
                key={script.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 font-mono font-semibold text-foreground">
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
                        className="text-[11px] text-destructive truncate max-w-[150px]"
                        title={script.processing_error}
                      >
                        {script.processing_error}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(script.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleViewScript(script.id)}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
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

      {/* Script Detail Modal */}
      {selectedScriptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-muted-foreground">Script Barcode</span>
                <h2 className="text-base font-bold font-mono text-foreground">
                  {scriptDetail?.barcode || selectedScriptId.slice(0, 8)}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleReprocess(selectedScriptId)}
                  disabled={reprocessing}
                  className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="Reprocess script pipeline"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${reprocessing ? "animate-spin" : ""}`} />
                  Reprocess
                </button>
                <button
                  onClick={() => setSelectedScriptId(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : scriptDetail ? (
              <div className="space-y-4 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                  <div>
                    <span className="text-muted-foreground">Current Status</span>
                    <div className="font-semibold capitalize text-foreground mt-0.5">
                      {scriptDetail.status}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Pages</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {scriptDetail.page_count}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created At</span>
                    <div className="font-semibold text-foreground mt-0.5">
                      {new Date(scriptDetail.created_at).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                {scriptDetail.processing_error && (
                  <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold">Processing Pipeline Error</div>
                      <div className="text-[11px] font-mono mt-0.5">{scriptDetail.processing_error}</div>
                    </div>
                  </div>
                )}

                {/* Pages & Regions breakdown */}
                <div className="space-y-3">
                  <h3 className="font-bold text-foreground flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-primary" />
                    Segmented Pages & Regions ({scriptDetail.pages?.length || 0})
                  </h3>

                  {!scriptDetail.pages || scriptDetail.pages.length === 0 ? (
                    <p className="text-muted-foreground italic py-2">
                      No page regions detected yet. Status: {scriptDetail.status}.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {scriptDetail.pages.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-xl border border-border p-3 space-y-2 bg-background"
                        >
                          <div className="flex items-center justify-between font-semibold text-foreground">
                            <span>Page {p.page_number}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {p.regions?.length || 0} region(s)
                            </span>
                          </div>

                          {p.regions && p.regions.length > 0 ? (
                            <div className="space-y-1.5 pl-2 border-l-2 border-primary/30">
                              {p.regions.map((r, rIdx) => (
                                <div key={r.id} className="text-[11px] space-y-0.5">
                                  <div className="flex items-center justify-between text-muted-foreground">
                                    <span className="font-medium text-foreground">
                                      Region #{rIdx + 1} {r.is_blank ? "(Blank)" : r.has_diagram ? "(Diagram)" : ""}
                                    </span>
                                    <span>Conf: {Math.round(r.transcription_confidence * 100)}%</span>
                                  </div>
                                  {r.transcription && (
                                    <p className="p-1.5 rounded bg-muted/50 font-mono text-[10px] text-foreground border border-border/50">
                                      "{r.transcription}"
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic">
                              No regions extracted for this page.
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-6">
                Failed to load script details.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
