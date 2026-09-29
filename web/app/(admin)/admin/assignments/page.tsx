"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  UserPlus,
  ArrowRight,
  FileText,
  Users,
  Shuffle,
  Settings2,
} from "lucide-react";

type Mode = "manual" | "auto";

export default function AssignmentsPage() {
  const [mode, setMode] = useState<Mode>("manual");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Assignments</h1>
      </div>

      {/* Assignment mode selector */}
      <div className="grid gap-4 sm:grid-cols-2 mb-6">
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
            <p className="text-sm font-medium text-foreground">
              Manual Assignment
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select specific scripts and assign to chosen examiners
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10 shrink-0">
            <Shuffle className="h-5 w-5 text-info" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Auto-Assignment
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automatically distribute scripts evenly across examiners
            </p>
          </div>
        </button>
      </div>

      {/* Assignment workflow */}
      {mode === "manual" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Manual Assignment Workflow
            </h2>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </div>
                <span>Select Paper</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </div>
                <span>Choose Scripts</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </div>
                <span>Assign Examiner</span>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0" />
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10 text-xs font-bold text-success">
                  ✓
                </div>
                <span>Confirm</span>
              </div>
            </div>
          </div>

          <EmptyState
            icon="📋"
            title="Select a paper to begin"
            description="Choose a paper from the Exams section first, then assign its ready scripts to examiners."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold text-foreground mb-4">
              Auto-Assignment Settings
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Scripts per examiner
                </label>
                <input
                  type="number"
                  defaultValue={20}
                  min={1}
                  max={100}
                  className="w-20 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Enable double marking
                </label>
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">
                  Randomize assignment order
                </label>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
              </div>
            </div>
            <button className="mt-4 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Shuffle className="h-4 w-4" />
              Run Auto-Assignment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
