"use client";

import { useState, useEffect } from "react";
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

  const fetchStats = async () => {
    setLoading(true);
    try {
      // In production, this would call a dedicated /analytics/dashboard endpoint
      // For now, aggregate from existing endpoints
      const [scripts, flags, moderation] = await Promise.allSettled([
        api.get<{ total: number }>("/scripts?page_size=1"),
        api.get<{ total: number }>("/flags?status=open&page_size=1"),
        api.get<{ total: number }>("/moderation?status=pending_routing&page_size=1"),
      ]);

      setStats({
        total_scripts:
          scripts.status === "fulfilled" ? scripts.value.total : 0,
        scripts_evaluated: 0,
        scripts_pending: 0,
        scripts_in_progress: 0,
        open_flags:
          flags.status === "fulfilled" ? flags.value.total : 0,
        moderation_pending:
          moderation.status === "fulfilled" ? moderation.value.total : 0,
        active_examiners: 0,
        completion_percent: 0,
      });
    } catch {
      // Use defaults
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const kpis = stats
    ? [
        {
          label: "Completion",
          value: `${stats.completion_percent}%`,
          icon: TrendingUp,
          color: "text-success",
          bgColor: "bg-success/10",
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
          color: stats.open_flags > 0 ? "text-warning" : "text-muted-foreground",
          bgColor: stats.open_flags > 0 ? "bg-warning/10" : "bg-muted",
        },
        {
          label: "Moderation Queue",
          value: stats.moderation_pending.toString(),
          icon: Clock,
          color:
            stats.moderation_pending > 0
              ? "text-info"
              : "text-muted-foreground",
          bgColor:
            stats.moderation_pending > 0 ? "bg-info/10" : "bg-muted",
        },
        {
          label: "Active Examiners",
          value: stats.active_examiners.toString(),
          icon: Users,
          color: "text-primary",
          bgColor: "bg-primary/10",
        },
        {
          label: "In Progress",
          value: stats.scripts_in_progress.toString(),
          icon: BarChart3,
          color: "text-info",
          bgColor: "bg-info/10",
        },
      ]
    : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
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
                  <span className="text-sm font-medium text-muted-foreground">
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
                <p className={cn("text-3xl font-bold", kpi.color)}>
                  {kpi.value}
                </p>
              </div>
            ))}
      </div>

      {/* Activity Feed placeholder */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-bold text-foreground mb-4">
          Recent Activity
        </h2>
        <div className="space-y-3">
          {[
            {
              icon: "📋",
              text: "Activity feed will show real-time events",
              time: "—",
            },
            {
              icon: "🔔",
              text: "Flag notifications, evaluation completions, and moderation updates",
              time: "—",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-2 border-b border-border last:border-0"
            >
              <span className="text-lg">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{item.text}</p>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
