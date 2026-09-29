"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
}

interface PageData {
  id: string;
  page_number: number;
  width: number;
  height: number;
  regions: Region[];
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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pages, setPages] = useState<PageData[]>([]);
  const [marks, setMarks] = useState<Map<string, AnswerMark>>(new Map());
  const [paper, setPaper] = useState<Paper | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "failed">("saved");
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const questionStartRef = useRef<number>(Date.now());

  // ── Load workspace data ──
  useEffect(() => {
    const load = async () => {
      try {
        // Start the evaluation
        await api.post(`/evaluations/${evaluationId}/start`, {});

        // Load workspace
        const workspace = await api.get<{
          questions: Question[];
          pages: PageData[];
          marks: AnswerMark[];
          paper: Paper;
        }>(`/evaluations/${evaluationId}/workspace`);

        setQuestions(workspace.questions);
        setPages(workspace.pages);
        setPaper(workspace.paper);

        // Index marks by question ID
        const markMap = new Map<string, AnswerMark>();
        workspace.marks.forEach((m) => markMap.set(m.question_id, m));
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

  // ── Find the region for the current question ──
  const currentRegion = currentQuestion
    ? pages
        .flatMap((p) => p.regions)
        .find((r) => r.question_id === currentQuestion.id)
    : null;

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

        // Update the mark with AI suggestion
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
      window.location.href = "/examiner";
    } catch {
      // Handle error
    }
  }, [evaluationId]);

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

  // ── Mark increment buttons ──
  const getMarkOptions = (maxMarks: number, increment: number): number[] => {
    const options: number[] = [0];
    let current = increment;
    while (current <= maxMarks) {
      options.push(current);
      current = Math.round((current + increment) * 100) / 100;
    }
    return options;
  };

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger in input fields
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
          // Request AI suggestion
          if (currentQuestion && paper?.ai_suggestions_enabled && !aiLoading) {
            e.preventDefault();
            requestAISuggestion(currentQuestion.id);
          }
          break;
        default:
          // Number keys 0-9 for quick marks
          if (/^[0-9]$/.test(e.key) && currentQuestion && paper) {
            const num = parseInt(e.key);
            const increment = paper.increment;
            const mark = num * increment;
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
  }, [currentQuestion, currentQuestionIdx, questions.length, paper, aiLoading]);

  // ── Progress ──
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
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-foreground">
            {paper?.code} — {paper?.name}
          </span>
          <span className="text-xs text-muted-foreground">
            Q{currentQuestionIdx + 1}/{questions.length}
          </span>
          <SaveStatus state={saveStatus} />
        </div>

        <div className="flex items-center gap-3">
          {/* Running total */}
          <span className="text-sm font-mono font-bold text-foreground">
            {totalMarksAwarded} / {paper?.total_marks || 0}
          </span>

          {/* Submit */}
          <button
            onClick={submitEvaluation}
            disabled={!allMarked}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              allMarked
                ? "bg-success text-success-foreground shadow-sm hover:opacity-90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
            Submit ({markedCount}/{questions.length})
          </button>
        </div>
      </div>

      {/* ── Main Split View ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Page Viewer */}
        <div className="flex-1 flex flex-col bg-muted/30 min-w-0">
          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-2 border-b border-border bg-card/50 py-1.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
              className="rounded-md p-1 text-muted-foreground hover:text-foreground"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground w-12 text-center">
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

          {/* Page image with region overlay */}
          <div className="flex-1 overflow-auto p-4">
            <div
              className="mx-auto relative bg-white rounded-lg shadow-md"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                width: "100%",
                maxWidth: "800px",
                minHeight: "600px",
              }}
            >
              {/* Placeholder for actual page image */}
              <div className="flex items-center justify-center h-full min-h-[600px] text-muted-foreground text-sm">
                {currentRegion ? (
                  <div className="p-6 w-full">
                    <div className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Student Answer — Q{currentQuestion?.question_number}
                      {currentQuestion?.sub_part}
                    </div>
                    {currentRegion.is_blank ? (
                      <div className="flex items-center gap-2 text-warning">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Blank answer detected
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="rounded-lg bg-muted/50 p-4 font-serif text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                          {currentRegion.transcription || "No transcription available"}
                        </div>
                        <div className="flex items-center gap-2">
                          <ConfidenceBadge
                            confidence={currentRegion.transcription_confidence}
                          />
                          {currentRegion.has_diagram && (
                            <span className="rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                              📐 Diagram detected
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <span>No region mapped for this question</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Marking Panel */}
        <div className="w-80 lg:w-96 border-l border-border bg-card flex flex-col shrink-0">
          {/* Question info */}
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
            {currentQuestion?.rubric && (
              <details className="mt-2">
                <summary className="text-xs text-primary cursor-pointer hover:underline">
                  View rubric
                </summary>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.rubric}
                </p>
              </details>
            )}
          </div>

          {/* AI Suggestion */}
          {paper?.ai_suggestions_enabled && currentQuestion && (
            <div className="border-b border-border p-4">
              {currentMark?.ai_band_min != null ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-ai" />
                    <span className="text-xs font-medium text-ai">
                      AI Suggestion
                    </span>
                    <ConfidenceBadge
                      confidence={currentMark.ai_confidence || 0}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-ai-suggestion/20 px-3 py-1.5 text-sm font-bold text-ai">
                      {currentMark.ai_band_min} – {currentMark.ai_band_max}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      / {currentQuestion.max_marks}
                    </span>
                  </div>
                  {currentMark.ai_reasons?.reasons && (
                    <ul className="space-y-1">
                      {currentMark.ai_reasons.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-1.5"
                        >
                          <span className="text-ai mt-0.5">•</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <button
                  onClick={() =>
                    currentQuestion && requestAISuggestion(currentQuestion.id)
                  }
                  disabled={aiLoading === currentQuestion.id}
                  className="flex items-center gap-2 rounded-lg border border-ai/30 bg-ai/5 px-3 py-2 text-sm font-medium text-ai hover:bg-ai/10 transition-colors w-full justify-center"
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
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Award Marks
              </label>

              {/* Quick mark buttons */}
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
                          "h-9 min-w-[2.25rem] rounded-lg border text-sm font-medium transition-all",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground shadow-sm scale-105"
                            : isInAiBand
                              ? "border-ai/40 bg-ai/10 text-ai hover:bg-ai/20"
                              : "border-border bg-card text-foreground hover:bg-muted"
                        )}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Override reason (shown when mark diverges from AI band) */}
              {currentMark?.is_override && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    <span className="text-xs font-medium text-warning">
                      Outside AI range
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your mark differs from the AI suggestion. This is recorded
                    for audit purposes.
                  </p>
                </div>
              )}

              {/* Flag button */}
              <button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Flag className="h-3.5 w-3.5" />
                Raise Flag
              </button>
            </div>
          </div>

          {/* Question navigator */}
          <div className="border-t border-border p-3">
            {/* Mini question grid */}
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
                          ? "bg-success/20 text-success border border-success/30"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                    )}
                    title={`Q${q.question_number}${q.sub_part}: ${mark?.is_marked ? `${mark.mark}/${q.max_marks}` : "Not marked"}`}
                  >
                    {q.question_number}
                    {q.sub_part}
                  </button>
                );
              })}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={currentQuestionIdx === 0}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <button
                onClick={goNext}
                disabled={currentQuestionIdx === questions.length - 1}
                className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
