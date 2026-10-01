"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { SaveStatus } from "@/components/shared/SaveStatus";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCw,
  AlertTriangle,
  Check,
  Loader2,
  Flag,
  X,
  FileImage,
} from "lucide-react";

// ── Types ──

interface Question {
  id: string;
  question_number: number;
  sub_part: string;
  text: string;
  max_marks: number;
  answer_type: string;
  rubric: string;
  order_index: number;
}

interface Region {
  id: string;
  question_id: string | null;
  bbox_x: number;
  bbox_y: number;
  bbox_w: number;
  bbox_h: number;
  transcription: string;
  transcription_confidence: number;
  has_diagram: boolean;
  is_blank: boolean;
  storage_key?: string | null;
}

interface PageData {
  id: string;
  page_number: number;
  width: number;
  height: number;
  regions: Region[];
  storage_key?: string | null;
}

interface AnswerMark {
  id: string;
  question_id: string;
  mark: number | null;
  is_marked: boolean;
  ai_band_min: number | null;
  ai_band_max: number | null;
  ai_confidence: number | null;
  ai_reasons: { reasons?: string[] } | null;
  is_override: boolean;
  override_reason: string | null;
  transcription: string;
  transcription_confidence: number;
  has_flag: boolean;
  time_spent_seconds: number;
}

interface Paper {
  name: string;
  code: string;
  total_marks: number;
  increment: number;
  ai_suggestions_enabled: boolean;
}

interface WorkspaceProps {
  evaluationId: string;
}

// ── Main Component ──

export function EvaluationWorkspace({ evaluationId }: WorkspaceProps) {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [marks, setMarks] = useState<Map<string, AnswerMark>>(new Map());
  const [paper, setPaper] = useState<Paper | null>(null);
  const [scriptId, setScriptId] = useState<string | null>(null);
  
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "failed">("saved");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  
  // Flag Modal state
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagType, setFlagType] = useState("manual");
  const [submittingFlag, setSubmittingFlag] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  // ── Load workspace data ──
  useEffect(() => {
    const load = async () => {
      try {
        await api.post(`/evaluations/${evaluationId}/start`, {});

        const workspace = await api.get<{
          questions: Question[];
          pages: PageData[];
          marks: AnswerMark[];
          paper: Paper;
          script_id?: string;
        }>(`/evaluations/${evaluationId}/workspace`);

        setQuestions(workspace.questions || []);
        setPages(workspace.pages || []);
        setPaper(workspace.paper || null);
        if (workspace.script_id) setScriptId(workspace.script_id);

        const markMap = new Map<string, AnswerMark>();
        (workspace.marks || []).forEach((m) => markMap.set(m.question_id, m));
        setMarks(markMap);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [evaluationId]);

  const currentQuestion = questions[currentQuestionIdx];
  const currentMark = currentQuestion ? marks.get(currentQuestion.id) : null;

  // Find the page & region for the current question
  const currentPage = pages.find((p) =>
    p.regions.some((r) => r.question_id === currentQuestion?.id)
  ) || pages[0];

  const currentRegion = currentQuestion
    ? pages
        .flatMap((p) => p.regions)
        .find((r) => r.question_id === currentQuestion.id)
    : null;

  // Image URL helper (constructs URL from storage_key if present)
  const getImageUrl = (storageKey?: string | null) => {
    if (!storageKey) return null;
    if (storageKey.startsWith("http://") || storageKey.startsWith("https://")) {
      return storageKey;
    }
    const rawBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${rawBase}/api/v1/storage/view?key=${encodeURIComponent(storageKey)}`;
  };

  const pageImageUrl = getImageUrl(currentRegion?.storage_key || currentPage?.storage_key);

  // ── Save mark ──
  const saveMark = useCallback(
    async (questionId: string, value: number) => {
      setSaveStatus("saving");
      const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);

      try {
        const saved = await api.post<AnswerMark>(
          `/evaluations/${evaluationId}/marks`,
          {
            question_id: questionId,
            region_id: currentRegion?.id || null,
            mark: value,
            time_spent_seconds: timeSpent,
          }
        );

        setMarks((prev) => {
          const next = new Map(prev);
          next.set(questionId, saved);
          return next;
        });
        setSaveStatus("saved");
      } catch {
        setSaveStatus("failed");
      }
    },
    [evaluationId, currentRegion]
  );

  // ── Request AI suggestion ──
  const requestAISuggestion = useCallback(
    async (questionId: string) => {
      setAiLoading(questionId);
      try {
        const suggestion = await api.post<{
          band_min: number;
          band_max: number;
          confidence: number;
          reasons: string[];
        }>(`/evaluations/${evaluationId}/suggest`, {
          evaluation_id: evaluationId,
          question_id: questionId,
          region_id: currentRegion?.id || null,
        });

        setMarks((prev) => {
          const next = new Map(prev);
          const existing = next.get(questionId);
          if (existing) {
            next.set(questionId, {
              ...existing,
              ai_band_min: suggestion.band_min,
              ai_band_max: suggestion.band_max,
              ai_confidence: suggestion.confidence,
              ai_reasons: { reasons: suggestion.reasons },
            });
          }
          return next;
        });
      } catch {
        // Handle error
      } finally {
        setAiLoading(null);
      }
    },
    [evaluationId, currentRegion]
  );

  // ── Submit evaluation ──
  const submitEvaluation = useCallback(async () => {
    const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
    try {
      await api.post(`/evaluations/${evaluationId}/submit`, {
        total_time_seconds: totalTime,
      });
      router.push("/examiner");
    } catch {
      // Handle error
    }
  }, [evaluationId, router]);

  // ── Raise Flag ──
  const handleRaiseFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagReason.trim()) {
      setFlagError("Please state a reason for flagging.");
      return;
    }
    setSubmittingFlag(true);
    setFlagError(null);
    try {
      await api.post("/flags", {
        flag_type: flagType,
        severity: "medium",
        message: flagReason.trim(),
        evaluation_id: evaluationId,
        question_id: currentQuestion?.id || null,
        script_id: scriptId || null,
      });
      setShowFlagModal(false);
      setFlagReason("");
      if (currentQuestion) {
        setMarks((prev) => {
          const next = new Map(prev);
          const existing = next.get(currentQuestion.id);
          if (existing) {
            next.set(currentQuestion.id, { ...existing, has_flag: true });
          }
          return next;
        });
      }
    } catch (err: any) {
      setFlagError(err?.error?.message || err?.message || "Failed to raise flag.");
    } finally {
      setSubmittingFlag(false);
    }
  };

  // ── Navigate ──
  const goNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx((i) => i + 1);
      questionStartRef.current = Date.now();
    }
  };
  const goPrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((i) => i - 1);
      questionStartRef.current = Date.now();
    }
  };

  const getMarkOptions = (maxMarks: number, increment: number): number[] => {
    const options: number[] = [0];
    let current = increment;
    while (current <= maxMarks) {
      options.push(current);
      current = Math.round((current + increment) * 100) / 100;
    }
    return options;
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "ArrowRight":
        case "n":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "p":
          e.preventDefault();
          goPrev();
          break;
        case "a":
          if (currentQuestion && paper?.ai_suggestions_enabled && !aiLoading) {
            e.preventDefault();
            requestAISuggestion(currentQuestion.id);
          }
          break;
        default:
          if (/^[0-9]$/.test(e.key) && currentQuestion && paper) {
            const num = parseInt(e.key);
            const mark = num * paper.increment;
            if (mark <= currentQuestion.max_marks) {
              e.preventDefault();
              saveMark(currentQuestion.id, mark);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, currentQuestionIdx, questions.length, paper, aiLoading, saveMark, requestAISuggestion]);

  const markedCount = Array.from(marks.values()).filter((m) => m.is_marked).length;
  const totalMarksAwarded = Array.from(marks.values())
    .filter((m) => m.is_marked && m.mark !== null)
    .reduce((sum, m) => sum + (m.mark || 0), 0);
  const allMarked = markedCount === questions.length && questions.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            {paper?.code} — {paper?.name}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            Q{currentQuestionIdx + 1}/{questions.length}
          </span>
          <SaveStatus state={saveStatus} />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-mono font-bold text-foreground">
            {totalMarksAwarded} / {paper?.total_marks || 0}
          </span>

          <button
            onClick={submitEvaluation}
            disabled={!allMarked}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              allMarked
                ? "bg-emerald-600 text-white shadow-sm hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
            Submit ({markedCount}/{questions.length})
          </button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Page Viewer Canvas */}
        <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
          <div className="flex items-center justify-center gap-2 border-b border-border bg-card/50 py-1.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground w-12 text-center font-mono">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div
              className="mx-auto relative bg-card border border-border rounded-xl shadow-md overflow-hidden"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                width: "100%",
                maxWidth: "800px",
                minHeight: "600px",
              }}
            >
              {pageImageUrl ? (
                <div className="relative w-full h-full min-h-[600px] flex items-center justify-center bg-black/5">
                  {/* Real Page Image */}
                  <img
                    src={pageImageUrl}
                    alt={`Page ${currentPage?.page_number || 1}`}
                    className="max-w-full h-auto object-contain shadow-sm"
                  />
                  
                  {/* Bounding box overlay if region exists */}
                  {currentRegion && currentRegion.bbox_w > 0 && (
                    <div
                      className="absolute border-2 border-primary bg-primary/10 rounded pointer-events-none transition-all"
                      style={{
                        left: `${currentRegion.bbox_x}%`,
                        top: `${currentRegion.bbox_y}%`,
                        width: `${currentRegion.bbox_w}%`,
                        height: `${currentRegion.bbox_h}%`,
                      }}
                    >
                      <span className="absolute -top-5 left-0 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded font-bold">
                        Q{currentQuestion?.question_number}{currentQuestion?.sub_part}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Fallback Transcription Card */
                <div className="p-6 h-full min-h-[600px] flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <FileImage className="h-4 w-4 text-primary" />
                        Candidate Answer Script — Q{currentQuestion?.question_number}
                        {currentQuestion?.sub_part}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Page {currentPage?.page_number || 1}
                      </span>
                    </div>

                    {currentRegion?.is_blank ? (
                      <div className="flex items-center gap-2 text-warning p-4 rounded-xl bg-warning/10 border border-warning/20">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          Blank answer area detected
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-xl bg-muted/40 p-4 font-serif text-sm leading-relaxed text-foreground whitespace-pre-wrap border border-border">
                          {currentRegion?.transcription || "No handwritten transcription available."}
                        </div>
                        <div className="flex items-center gap-2">
                          {currentRegion && (
                            <ConfidenceBadge
                              confidence={currentRegion.transcription_confidence}
                            />
                          )}
                          {currentRegion?.has_diagram && (
                            <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
                              📐 Diagram Region
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Marking Panel */}
        <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col shrink-0">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground">
                Q{currentQuestion?.question_number}
                {currentQuestion?.sub_part && `(${currentQuestion.sub_part})`}
              </h3>
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                Max: {currentQuestion?.max_marks}
              </span>
            </div>
            {currentQuestion?.text && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentQuestion.text}
              </p>
            )}
          </div>

          {/* AI Suggestion */}
          {paper?.ai_suggestions_enabled && currentQuestion && (
            <div className="border-b border-border p-4">
              {currentMark?.ai_band_min != null ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                      AI Suggested Score
                    </span>
                    <ConfidenceBadge
                      confidence={currentMark.ai_confidence || 0}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-purple-500/10 px-3 py-1.5 text-sm font-bold text-purple-600 dark:text-purple-400">
                      {currentMark.ai_band_min} – {currentMark.ai_band_max}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {currentQuestion.max_marks}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() =>
                    currentQuestion && requestAISuggestion(currentQuestion.id)
                  }
                  disabled={aiLoading === currentQuestion.id}
                  className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/5 px-3 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition-colors w-full justify-center"
                >
                  {aiLoading === currentQuestion.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Get AI Suggestion
                </button>
              )}
            </div>
          )}

          {/* Mark Input */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-3">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Award Marks
              </label>

              {currentQuestion && paper && (
                <div className="flex flex-wrap gap-1.5">
                  {getMarkOptions(
                    currentQuestion.max_marks,
                    paper.increment
                  ).map((value) => {
                    const isSelected = currentMark?.mark === value;
                    const isInAiBand =
                      currentMark?.ai_band_min != null &&
                      value >= currentMark.ai_band_min &&
                      value <= (currentMark.ai_band_max || 0);

                    return (
                      <button
                        key={value}
                        onClick={() =>
                          currentQuestion && saveMark(currentQuestion.id, value)
                        }
                        className={cn(
                          "h-9 min-w-[2.25rem] rounded-lg border text-xs font-semibold transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm scale-105"
                            : isInAiBand
                              ? "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              : "border-border bg-card text-foreground hover:bg-muted"
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Raise Flag Trigger */}
              <button
                onClick={() => setShowFlagModal(true)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  currentMark?.has_flag
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Flag className="h-3.5 w-3.5" />
                {currentMark?.has_flag ? "Flagged" : "Raise Flag"}
              </button>
            </div>
          </div>

          {/* Question Grid Navigator */}
          <div className="border-t border-border p-3">
            <div className="flex flex-wrap gap-1 mb-3">
              {questions.map((q, idx) => {
                const mark = marks.get(q.id);
                const isActive = idx === currentQuestionIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestionIdx(idx);
                      questionStartRef.current = Date.now();
                    }}
                    className={cn(
                      "h-7 w-7 rounded text-xs font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                        : mark?.is_marked
                          ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {q.question_number}{q.sub_part}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={currentQuestionIdx === 0}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentQuestionIdx === questions.length - 1}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Flag className="h-4 w-4 text-amber-500" />
                Raise Answer Sheet Flag
              </h2>
              <button
                onClick={() => setShowFlagModal(false)}
                className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {flagError && (
              <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                {flagError}
              </div>
            )}

            <form onSubmit={handleRaiseFlag} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium mb-1">Flag Type</label>
                <select
                  value={flagType}
                  onChange={(e) => setFlagType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="blank_answer">Blank / Unanswered Area</option>
                  <option value="illegible_handwriting">Illegible Handwriting</option>
                  <option value="out_of_syllabus">Incorrect / Mapped Question</option>
                  <option value="manual">General Examiner Query</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Reason / Note *</label>
                <textarea
                  required
                  rows={3}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="Describe why this question or answer script requires controller review..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFlagModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFlag}
                  className="rounded-lg bg-amber-500 text-white px-4 py-2 text-xs font-medium shadow-sm hover:bg-amber-600 disabled:opacity-50"
                >
                  {submittingFlag ? "Submitting..." : "Submit Flag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
