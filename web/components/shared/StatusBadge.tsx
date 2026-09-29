import { cn } from "@/lib/utils";

type StatusType =
  | "pending"
  | "in_progress"
  | "flagged"
  | "in_moderation"
  | "completed"
  | "finalized";

const statusConfig: Record<
  StatusType,
  { label: string; colorClass: string; icon: string }
> = {
  pending: {
    label: "Pending",
    colorClass: "bg-status-pending/15 text-status-pending border-status-pending/30",
    icon: "⏳",
  },
  in_progress: {
    label: "In Progress",
    colorClass: "bg-status-in-progress/15 text-status-in-progress border-status-in-progress/30",
    icon: "✏️",
  },
  flagged: {
    label: "Needs Attention",
    colorClass: "bg-status-flagged/15 text-status-flagged border-status-flagged/30",
    icon: "🚩",
  },
  in_moderation: {
    label: "Second Evaluation",
    colorClass: "bg-status-moderation/15 text-status-moderation border-status-moderation/30",
    icon: "👥",
  },
  completed: {
    label: "Completed",
    colorClass: "bg-status-completed/15 text-status-completed border-status-completed/30",
    icon: "✅",
  },
  finalized: {
    label: "Finalized",
    colorClass: "bg-status-finalized/15 text-status-finalized border-status-finalized/30",
    icon: "🔒",
  },
};

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.colorClass,
        className
      )}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}
