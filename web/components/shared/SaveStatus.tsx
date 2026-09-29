import { cn } from "@/lib/utils";

type SaveState = "saved" | "saving" | "retrying" | "failed";

const stateConfig: Record<
  SaveState,
  { label: string; colorClass: string; icon: string }
> = {
  saved: {
    label: "Saved",
    colorClass: "text-success",
    icon: "✓",
  },
  saving: {
    label: "Saving...",
    colorClass: "text-muted-foreground",
    icon: "⟳",
  },
  retrying: {
    label: "Reconnecting...",
    colorClass: "text-warning",
    icon: "⟳",
  },
  failed: {
    label: "Not saved. Retry",
    colorClass: "text-destructive",
    icon: "✗",
  },
};

interface SaveStatusProps {
  state: SaveState;
  onRetry?: () => void;
  className?: string;
}

export function SaveStatus({ state, onRetry, className }: SaveStatusProps) {
  const config = stateConfig[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        config.colorClass,
        state === "saving" && "animate-pulse",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(state === "saving" || state === "retrying" ? "animate-spin" : "")}
      >
        {config.icon}
      </span>
      {state === "failed" && onRetry ? (
        <button onClick={onRetry} className="underline hover:no-underline">
          {config.label}
        </button>
      ) : (
        config.label
      )}
    </span>
  );
}
