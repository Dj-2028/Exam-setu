"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api/client";
import { ScriptUpload } from "@/features/admin/ScriptUpload";
import { ScriptList } from "@/features/admin/ScriptList";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/Skeleton";
import {
  BookOpen,
  FileText,
  Upload,
  ChevronRight,
  Plus,
  X,
  RefreshCw,
  AlertCircle,
  FileCode,
} from "lucide-react";

interface Paper {
  id: string;
  exam_id: string;
  name: string;
  code: string;
  total_marks: number;
  passing_marks: number;
  increment: number;
  language: string;
  status: string;
  question_count: number;
}

interface Exam {
  id: string;
  name: string;
  code: string;
  session: string;
  status: string;
  paper_count: number;
  created_at: string;
}

const DEFAULT_PAPER_ID = "00000000-0000-0000-0000-000000000001";
type Tab = "exams" | "upload" | "scripts";

export default function AdminExamsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("exams");
  const [exams, setExams] = useState<Exam[]>([]);
  const [papersMap, setPapersMap] = useState<Record<string, Paper[]>>({});
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>(DEFAULT_PAPER_ID);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [showExamModal, setShowExamModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState<string | null>(null); // exam_id

  // Exam Form
  const [examName, setExamName] = useState("");
  const [examCode, setExamCode] = useState("");
  const [examSession, setExamSession] = useState("June 2026");
  const [submittingExam, setSubmittingExam] = useState(false);
  const [examModalError, setExamModalError] = useState<string | null>(null);

  // Paper Form
  const [paperName, setPaperName] = useState("");
  const [paperCode, setPaperCode] = useState("");
  const [paperTotalMarks, setPaperTotalMarks] = useState(100);
  const [paperPassingMarks, setPaperPassingMarks] = useState(33);
  const [paperIncrement, setPaperIncrement] = useState(0.5);
  const [paperLang, setPaperLang] = useState("en");
  const [submittingPaper, setSubmittingPaper] = useState(false);
  const [paperModalError, setPaperModalError] = useState<string | null>(null);

  const fetchExamsAndPapers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const examsRes = await api.get<{ items: Exam[] }>("/exams");
      const fetchedExams = examsRes.items || [];
      setExams(fetchedExams);

      // Fetch papers for each exam
      const map: Record<string, Paper[]> = {};
      const collected: Paper[] = [];
      for (const e of fetchedExams) {
        try {
          const papersRes = await api.get<{ items: Paper[] }>(`/exams/${e.id}/papers`);
          map[e.id] = papersRes.items || [];
          collected.push(...(papersRes.items || []));
        } catch {
          map[e.id] = [];
        }
      }
      setPapersMap(map);
      setAllPapers(collected);

      if (collected.length > 0 && selectedPaperId === DEFAULT_PAPER_ID) {
        setSelectedPaperId(collected[0].id);
      }
    } catch (err: any) {
      setError(err?.error?.message || err?.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, [selectedPaperId]);

  useEffect(() => {
    fetchExamsAndPapers();
  }, [fetchExamsAndPapers]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examCode) {
      setExamModalError("Name and Code are required.");
      return;
    }
    setSubmittingExam(true);
    setExamModalError(null);
    try {
      await api.post("/exams", {
        name: examName,
        code: examCode.toUpperCase(),
        session: examSession,
      });
      setShowExamModal(false);
      setExamName("");
      setExamCode("");
      setExamSession("June 2026");
      await fetchExamsAndPapers();
    } catch (err: any) {
      setExamModalError(err?.error?.message || err?.message || "Failed to create exam");
    } finally {
      setSubmittingExam(false);
    }
  };

  const handleCreatePaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaperModal || !paperName || !paperCode) {
      setPaperModalError("Name and Code are required.");
      return;
    }
    setSubmittingPaper(true);
    setPaperModalError(null);
    try {
      const created = await api.post<Paper>(`/exams/${showPaperModal}/papers`, {
        name: paperName,
        code: paperCode.toUpperCase(),
        total_marks: Number(paperTotalMarks),
        passing_marks: Number(paperPassingMarks),
        increment: Number(paperIncrement),
        language: paperLang,
      });
      setShowPaperModal(null);
      setPaperName("");
      setPaperCode("");
      setSelectedPaperId(created.id);
      await fetchExamsAndPapers();
    } catch (err: any) {
      setPaperModalError(err?.error?.message || err?.message || "Failed to create paper");
    } finally {
      setSubmittingPaper(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Exams & Papers</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create exams, manage question paper structures, and upload candidate scripts
          </p>
        </div>

        {/* Paper Selector Dropdown */}
        {allPapers.length > 0 && (
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg shadow-sm">
            <span className="text-xs text-muted-foreground font-medium">Active Paper:</span>
            <select
              value={selectedPaperId}
              onChange={(e) => setSelectedPaperId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {allPapers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">
        {[
          { id: "exams" as Tab, label: "Exams & Papers", icon: BookOpen },
          { id: "upload" as Tab, label: "Upload Scripts", icon: Upload },
          { id: "scripts" as Tab, label: "Script Queue", icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab: Exams & Papers */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Examinations registered on the platform
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchExamsAndPapers()}
                className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowExamModal(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Create Exam
              </button>
            </div>
          </div>

          {loading ? (
            <ListSkeleton items={3} />
          ) : exams.length === 0 ? (
            <EmptyState
              icon="📚"
              title="No exams created yet"
              description="Create an exam, add papers with question templates, then upload answer scripts."
              action={
                <button
                  onClick={() => setShowExamModal(true)}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm"
                >
                  + Create First Exam
                </button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {exams.map((ex) => {
                const papers = papersMap[ex.id] || [];
                return (
                  <div
                    key={ex.id}
                    className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-primary">
                          {ex.code}
                        </span>
                        <h2 className="text-sm font-bold text-foreground mt-1">
                          {ex.name}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Session: {ex.session}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowPaperModal(ex.id)}
                        className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" /> Add Paper
                      </button>
                    </div>

                    {/* Papers List */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                        <span>Papers ({papers.length})</span>
                      </div>
                      {papers.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic py-1">
                          No papers added yet.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {papers.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPaperId(p.id);
                                setActiveTab("upload");
                              }}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                selectedPaperId === p.id
                                  ? "border-primary bg-primary/5 font-medium"
                                  : "border-border/60 hover:bg-muted/40"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <FileCode className="h-3.5 w-3.5 text-primary" />
                                <div>
                                  <span className="font-semibold">{p.code}</span> — {p.name}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground">
                                  {p.total_marks} Marks
                                </span>
                                <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                                  Upload
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Upload Scripts */}
      {activeTab === "upload" && (
        <div className="max-w-xl space-y-4">
          <p className="text-xs text-muted-foreground">
            Upload PDF answer scripts for target paper ID:{" "}
            <span className="font-mono text-foreground font-semibold">
              {selectedPaperId}
            </span>
          </p>
          <ScriptUpload
            paperId={selectedPaperId}
            onComplete={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      )}

      {/* Tab: Script Queue */}
      {activeTab === "scripts" && (
        <ScriptList paperId={selectedPaperId} refreshKey={refreshKey} />
      )}

      {/* Create Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Create New Exam</h2>
              <button
                onClick={() => setShowExamModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {examModalError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {examModalError}
              </div>
            )}

            <form onSubmit={handleCreateExam} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Exam Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Sc Physics Sem-4"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Exam Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSC-PHY-S4-2026"
                  value={examCode}
                  onChange={(e) => setExamCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Session</label>
                <input
                  type="text"
                  value={examSession}
                  onChange={(e) => setExamSession(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExamModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExam}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {submittingExam ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Paper Modal */}
      {showPaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Add Question Paper</h2>
              <button
                onClick={() => setShowPaperModal(null)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {paperModalError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {paperModalError}
              </div>
            )}

            <form onSubmit={handleCreatePaper} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Paper Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quantum Mechanics & Optics"
                  value={paperName}
                  onChange={(e) => setPaperName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Paper Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHY-401"
                  value={paperCode}
                  onChange={(e) => setPaperCode(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Total Marks</label>
                  <input
                    type="number"
                    value={paperTotalMarks}
                    onChange={(e) => setPaperTotalMarks(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">Passing Marks</label>
                  <input
                    type="number"
                    value={paperPassingMarks}
                    onChange={(e) => setPaperPassingMarks(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium mb-1">Marking Increment</label>
                  <select
                    value={paperIncrement}
                    onChange={(e) => setPaperIncrement(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={0.5}>0.5 Marks</option>
                    <option value={1.0}>1.0 Marks</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1">Language</label>
                  <select
                    value={paperLang}
                    onChange={(e) => setPaperLang(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mixed">Bilingual</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPaperModal(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPaper}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm disabled:opacity-50"
                >
                  {submittingPaper ? "Adding..." : "Add Paper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
