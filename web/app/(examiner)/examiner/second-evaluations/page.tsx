"use client";

import { SheetQueue } from "@/features/examiner/SheetQueue";

export default function SecondEvaluationsPage() {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Secondary Evaluations (Moderation)</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review second-marking assignments for moderation and score reconciliation
        </p>
      </div>

      <SheetQueue evaluationType="secondary" />
    </div>
  );
}
