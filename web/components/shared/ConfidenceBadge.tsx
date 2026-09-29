import { cn } from "@/lib/utils";

type ConfidenceLevel = "high" | "medium" | "low";

function getLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

const levelConfig: Record<
  ConfidenceLevel,
  { label: string; colorClass: string; icon: string }
> = {
  high: {
    label: "High Confidence",
    colorClass: "bg-confidence-high/15 text-confidence-high border-confidence-high/30",
    icon: "●",
  },
  medium: {
    label: "Medium Confidence",
    colorClass:
      "bg-confidence-medium/15 text-confidence-medium border-confidence-medium/30",
    icon: "◐",
  },
  low: {
    label: "Low Confidence",
    colorClass: "bg-confidence-low/15 text-confidence-low border-confidence-low/30",
    icon: "○",
  },
};

interface ConfidenceBadgeProps {
  confidence: number;
  className?: string;
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  const level = getLevel(confidence);
  const config = levelConfig[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.colorClass,
        className
      )}
      title={`${(confidence * 100).toFixed(0)}%`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
