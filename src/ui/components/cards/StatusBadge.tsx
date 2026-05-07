import type { ToolStatus } from "./utils";

interface StatusBadgeProps {
  status: ToolStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    pending: { color: "bg-muted", label: "Pending", icon: null },
    running: { color: "bg-info", label: "Running", icon: "animate-spin" },
    success: { color: "bg-success", label: "Success", icon: null },
    error: { color: "bg-error", label: "Error", icon: null },
  }[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${status === "running" ? "bg-info-light text-info-foreground" : ""}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} ${config.icon || ""}`} />
      {config.label}
    </span>
  );
}

interface StatusDotProps {
  variant?: "accent" | "success" | "error" | "info";
  isActive?: boolean;
  isVisible?: boolean;
}

export function StatusDot({ variant = "accent", isActive = false, isVisible = true }: StatusDotProps) {
  if (!isVisible) return null;
  const colorClass = {
    success: "bg-success",
    error: "bg-error",
    info: "bg-info",
    accent: "bg-accent-500",
  }[variant] || "bg-accent-500";

  return (
    <span className="relative flex h-2 w-2">
      {isActive && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${colorClass} opacity-75`} />}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${colorClass}`} />
    </span>
  );
}
