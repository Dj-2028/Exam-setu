"use client";

import { useState } from "react";
import { ScriptUpload } from "@/features/admin/ScriptUpload";
import { ScriptList } from "@/features/admin/ScriptList";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookOpen, FileText, Upload, ChevronRight } from "lucide-react";

// Placeholder data — will be fetched from API once connected to DB
const DEMO_PAPER_ID = "00000000-0000-0000-0000-000000000001";

type Tab = "exams" | "upload" | "scripts";

export default function AdminExamsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("exams");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-foreground">Exams & Papers</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 rounded-lg bg-muted p-1 w-fit">
        {[
          { id: "exams" as Tab, label: "Exams", icon: BookOpen },
          { id: "upload" as Tab, label: "Upload Scripts", icon: Upload },
          { id: "scripts" as Tab, label: "Script Queue", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Manage examinations and their papers
            </p>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
              + Create Exam
            </button>
          </div>
          <EmptyState
            icon="📚"
            title="No exams created yet"
            description="Create an exam, add papers with question templates, then upload answer scripts."
            action={
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-1">Create Exam</span>
                <ChevronRight className="h-3 w-3" />
                <span className="rounded bg-muted px-2 py-1">Add Papers</span>
                <ChevronRight className="h-3 w-3" />
                <span className="rounded bg-muted px-2 py-1">Set Questions</span>
                <ChevronRight className="h-3 w-3" />
                <span className="rounded bg-muted px-2 py-1">Upload Scripts</span>
              </div>
            }
          />
        </div>
      )}

      {activeTab === "upload" && (
        <div className="max-w-xl">
          <p className="text-sm text-muted-foreground mb-4">
            Upload PDF answer scripts for processing. Each file is named by its
            barcode. The system will automatically split pages, clean images,
            detect answer regions, and transcribe handwriting.
          </p>
          <ScriptUpload
            paperId={DEMO_PAPER_ID}
            onComplete={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      )}

      {activeTab === "scripts" && (
        <ScriptList paperId={DEMO_PAPER_ID} refreshKey={refreshKey} />
      )}
    </div>
  );
}
