"use client";

import { use } from "react";
import { EvaluationWorkspace } from "@/features/examiner/EvaluationWorkspace";

interface Props {
  params: Promise<{ evaluationId: string }>;
}

export default function EvaluatePage({ params }: Props) {
  const { evaluationId } = use(params);

  return <EvaluationWorkspace evaluationId={evaluationId} />;
}
