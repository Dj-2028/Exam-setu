"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Users,
  FileCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface DashboardStats {
  total_scripts: number;
  scripts_evaluated: number;
  scripts_pending: number;
  scripts_in_progress: number;
  open_flags: number;
  moderation_pending: number;
  active_examiners: number;
  completion_percent: number;
}

export default function ControllerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [
        totalRes,
        evaluatedRes,
        inProgressRes,
        flagsRes,
        moderationRes,
        examinersRes,
      ] = await Promise.allSettled([
        api.get<{ total: number }>("/scripts?page_size=1"),
        api.get<{ total: number }>("/scripts?status=evaluated&page_size=1"),
        api.get<{ total: number }>("/scripts?status=evaluation_in_progress&page_size=1"),
        api.get<{ total: number }>("/flags?status=open&page_size=1"),
        api.get<{ total: number }>("/moderation?status=pending_routing&page_size=1"),
        api.get<{ total: number }>("/users?role=examiner&page_size=1"),
      ]);

      const total = totalRes.status === "fulfilled" ? totalRes.value.total : 0;
      const evaluated = evaluatedRes.status === "fulfilled" ? evaluatedRes.value.total : 0;
      const inProgress = inProgressRes.status === "fulfilled" ? inProgressRes.value.total : 0;
      const openFlags = flagsRes.status === "fulfilled" ? flagsRes.value.total : 0;
      const moderationPending = moderationRes.status === "fulfilled" ? moderationRes.value.total : 0;
      const examiners = examinersRes.status === "fulfilled" ? examinersRes.value.total : 0;
      
      const completionPercent = total > 0 ? Math.round((evaluated / total) * 100) : 0;

      setStats({
        total_scripts: total,
        scripts_evaluated: evaluated,
        scripts_pending: Math.max(0, total - evaluated - inProgress),
        scripts_in_progress: inProgress,
        open_flags: openFlags,
        moderation_pending: moderationPending,
        active_examiners: examiners,
        completion_percent: completionPercent,
      });
    } catch {
      setStats({
        total_scripts: 0,
        scripts_evaluated: 0,
        scripts_pending: 0,
        scripts_in_progress: 0,
        open_flags: 0,
        moderation_pending: 0,
        active_examiners: 0,
        completion_percent: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = stats
    ? [
        {
          label: "Evaluation Progress",
          value: `${stats.completion_percent}%`,
          icon: TrendingUp,
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-500/10",
        },
        {
          label: "Total Scripts",
          value: stats.total_scripts.toString(),
          icon: FileCheck,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          label: "Open Flags",
          value: stats.open_flags.toString(),
          icon: AlertTriangle,
          color: stats.open_flags > 0 ? "text-amber-500" : "text-muted-foreground",
          bgColor: stats.open_flags > 0 ? "bg-amber-500/10" : "bg-muted",
        },
        {
          label: "Moderation Queue",
          value: stats.moderation_pending.toString(),
          icon: Clock,
          color: stats.moderation_pending > 0 ? "text-blue-500" : "text-muted-foreground",
          bgColor: stats.moderation_pending > 0 ? "bg-blue-500/10" : "bg-muted",
        },
        {
          label: "Active Examiners",
          value: stats.active_examiners.toString(),
          icon: Users,
          color: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-500/10",
        },
        {
          label: "In Progress",
          value: stats.scripts_in_progress.toString(),
          icon: BarChart3,
          color: "text-blue-500",
          bgColor: "bg-blue-500/10",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Controller Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time evaluation statistics, queue status, and moderation metrics
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 animate-pulse"
              >
                <div className="h-4 w-24 bg-muted rounded mb-3" />
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))
          : kpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {kpi.label}
                  </span>
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      kpi.bgColor
                    )}
                  >
                    <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                </div>
                <p className={cn("text-3xl font-bold font-mono", kpi.color)}>
                  {kpi.value}
                </p>
              </div>
            ))}
      </div>

      {/* Controller Summary Card */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-foreground">
          Evaluation Operations Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground">Evaluated Scripts:</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {stats?.scripts_evaluated || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground">Pending Evaluation:</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {stats?.scripts_pending || 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-muted/40 border border-border">
            <span className="text-muted-foreground">In Progress:</span>
            <div className="text-base font-bold text-foreground mt-0.5">
              {stats?.scripts_in_progress || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
