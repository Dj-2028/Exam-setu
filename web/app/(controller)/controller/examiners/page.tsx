"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Loader2,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  BarChart3,
  Sparkles,
  Shield,
} from "lucide-react";

interface ExaminerMetric {
  id: string;
  examiner_id: string;
  scripts_evaluated: number;
  scripts_pending: number;
  avg_time_per_script_seconds: number;
  avg_total_marks: number;
  std_dev_total_marks: number;
  ai_suggestions_requested: number;
  ai_suggestions_accepted: number;
  ai_overrides: number;
  speed_anomaly_score: number;
  uniformity_anomaly_score: number;
  outlier_anomaly_score: number;
  overall_anomaly_score: number;
}

function formatTime(seconds: number): string {
  if (seconds === 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function AnomalyBar({ score, label }: { score: number; label: string }) {
  const color =
    score > 0.7
      ? "bg-destructive"
      : score > 0.4
        ? "bg-warning"
        : score > 0.1
          ? "bg-info"
          : "bg-success";

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">{label}</span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.max(score * 100, 2)}%` }}
        />
      </div>
    </div>
  );
}

export default function ExaminersPage() {
  const [metrics, setMetrics] = useState<ExaminerMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<{ items: ExaminerMetric[] }>(
          "/analytics/examiners?page_size=50"
        );
        setMetrics(data.items);
      } catch {
        setMetrics([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
        <h1 className="text-xl font-bold text-foreground">
          Examiner Analytics
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="h-3.5 w-3.5" />
          Ranked by anomaly score
        </div>
      </div>

      {metrics.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No examiner data yet"
          description="Metrics will appear after evaluations are submitted."
        />
      ) : (
        <div className="space-y-3">
          {metrics.map((m) => {
            const aiAcceptRate =
              m.ai_suggestions_requested > 0
                ? (m.ai_suggestions_accepted / m.ai_suggestions_requested) * 100
                : 0;

            return (
              <div
                key={m.id}
                className={cn(
                  "rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm",
                  m.overall_anomaly_score > 0.7
                    ? "border-destructive/40"
                    : m.overall_anomaly_score > 0.4
                      ? "border-warning/40"
                      : "border-border"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Anomaly indicator */}
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                      m.overall_anomaly_score > 0.7
                        ? "bg-destructive/10"
                        : m.overall_anomaly_score > 0.4
                          ? "bg-warning/10"
                          : "bg-success/10"
                    )}
                  >
                    {m.overall_anomaly_score > 0.7 ? (
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    ) : m.overall_anomaly_score > 0.4 ? (
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    ) : (
                      <Users className="h-5 w-5 text-success" />
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground">
                        Examiner #{m.examiner_id.slice(0, 8)}
                      </span>
                      {m.overall_anomaly_score > 0.5 && (
                        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
                          REVIEW
                        </span>
                      )}
                    </div>

                    {/* Metric grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Evaluated
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {m.scripts_evaluated}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg Time
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {formatTime(m.avg_time_per_script_seconds)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Avg Marks
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {m.avg_total_marks.toFixed(1)} ±
                            {m.std_dev_total_marks.toFixed(1)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            AI Accept
                          </p>
                          <p className="text-sm font-bold text-foreground">
                            {aiAcceptRate.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Anomaly breakdown */}
                    <div className="grid grid-cols-3 gap-3">
                      <AnomalyBar
                        score={m.speed_anomaly_score}
                        label="Speed"
                      />
                      <AnomalyBar
                        score={m.uniformity_anomaly_score}
                        label="Uniformity"
                      />
                      <AnomalyBar
                        score={m.outlier_anomaly_score}
                        label="Outlier"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
