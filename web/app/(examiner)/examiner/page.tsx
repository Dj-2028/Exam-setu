"use client";

import { SheetQueue } from "@/features/examiner/SheetQueue";

export default function ExaminerHomePage() {
  return (
    <div className="p-4 lg:p-6">
      <h1 className="text-xl font-bold text-foreground mb-6">My Sheets</h1>
      <SheetQueue />
    </div>
  );
}
