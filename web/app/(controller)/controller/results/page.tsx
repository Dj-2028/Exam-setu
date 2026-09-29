"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Loader2,
  Download,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  FileSpreadsheet,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";

interface ResultSummary {
  paper_id: string;
  total_results: number;
  passed: number;
  failed: number;
  pass_rate: number;
  avg_marks: number;
  highest: number;
  lowest: number;
  moderated_count: number;
  flagged_count: number;
}

interface ResultEntry {
  id: string;
  barcode: string;
  primary_total: number;
  secondary_total: number | null;
  final_total: number;
  max_marks: number;
  percentage: number;
  passed: boolean;
  is_moderated: boolean;
  has_flags: boolean;
}

// Placeholder paper ID — will be dynamic
const DEMO_PAPER_ID = "00000000-0000-0000-0000-000000000001";

export default function ResultsPage() {
  const [summary, setSummary] = useState<ResultSummary | null>(null);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, resultsData] = await Promise.allSettled([
          api.get<ResultSummary>(`/results/${DEMO_PAPER_ID}/summary`),
          api.get<{ items: ResultEntry[] }>(`/results/${DEMO_PAPER_ID}?page_size=100`),
        ]);
        if (summaryData.status === "fulfilled") setSummary(summaryData.value);
        if (resultsData.status === "fulfilled") setResults(resultsData.value.items);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const job = await api.post<{ id: string; status: string }>(
        `/results/${DEMO_PAPER_ID}/export`,
        { format }
      );
      if (job.status === "ready") {
        window.open(`/api/v1/results/exports/${job.id}/download`, "_blank");
      }
    } catch {
      // Handle error
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Results</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </button>
          <button
            onClick={() => handleExport("xlsx")}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && summary.total_results > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Pass Rate
                </span>
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <p className="text-2xl font-bold text-success">
                {summary.pass_rate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.passed} passed / {summary.failed} failed
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Average Marks
                </span>
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {summary.avg_marks}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Range: {summary.lowest} — {summary.highest}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Scripts
                </span>
                <Award className="h-4 w-4 text-info" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {summary.total_results}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.moderated_count} moderated
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Flagged
                </span>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </div>
              <p className="text-2xl font-bold text-warning">
                {summary.flagged_count}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Scripts with flags
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Barcode
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Primary
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Secondary
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Final
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    %
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Result
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium">
                      {r.barcode}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.primary_total}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {r.secondary_total !== null ? r.secondary_total : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {r.final_total}
                      <span className="text-muted-foreground font-normal">
                        /{r.max_marks}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.passed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          <Check className="h-3 w-3" />
                          PASS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                          <X className="h-3 w-3" />
                          FAIL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {r.is_moderated && (
                          <span
                            className="text-info"
                            title="Moderated"
                          >
                            ⚖️
                          </span>
                        )}
                        {r.has_flags && (
                          <span
                            className="text-warning"
                            title="Has flags"
                          >
                            🚩
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState
          icon="📊"
          title="No results yet"
          description="Results will appear after tabulation is run by an admin."
        />
      )}
    </div>
  );
}
