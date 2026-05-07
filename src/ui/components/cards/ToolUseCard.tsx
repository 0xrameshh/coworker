import { memo, useEffect } from "react";
import { StatusBadge } from "./StatusBadge";
import { TOOL_ICONS } from "./ToolIcons";
import { useToolStatus, setToolStatus, hasToolStatus, type ToolStatus } from "./utils";

type MessageContent = any;

interface ToolUseCardProps {
  messageContent: MessageContent;
}

export const ToolUseCard = memo(function ToolUseCard({ messageContent }: ToolUseCardProps) {
  const toolStatus = useToolStatus(messageContent.type === "tool_use" ? messageContent.id : undefined);
  const statusVariant: ToolStatus = toolStatus || "pending";

  if (messageContent.type !== "tool_use") return null;

  useEffect(() => {
    if (messageContent?.id && !hasToolStatus(messageContent.id)) setToolStatus(messageContent.id, "pending");
  }, [messageContent?.id]);

  const getToolInfo = (): { label: string; value: string } | null => {
    const input = messageContent.input as Record<string, any>;
    switch (messageContent.name) {
      case "Bash":
        return { label: "Command", value: input?.command || "No command" };
      case "Read":
        return { label: "File", value: input?.file_path || "Unknown file" };
      case "Write":
        return { label: "Write to", value: input?.file_path || "Unknown file" };
      case "Edit":
        return { label: "Edit file", value: input?.file_path || "Unknown file" };
      case "Glob":
        return { label: "Pattern", value: input?.pattern || "No pattern" };
      case "Grep":
        return { label: "Search", value: input?.query || input?.pattern || "No query" };
      case "Task":
        return { label: "Task", value: input?.description || "No description" };
      case "WebFetch":
        return { label: "URL", value: input?.url || "Unknown URL" };
      case "LS":
        return { label: "Directory", value: input?.path || input?.cwd || "Current dir" };
      default:
        return { label: "Input", value: JSON.stringify(input).slice(0, 50) + "..." };
    }
  };

  const toolInfo = getToolInfo();
  const ToolIcon = TOOL_ICONS[messageContent.name] || TOOL_ICONS.default;

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-ink-900/5 bg-surface-secondary/30 p-4 mt-6 interactive-card border-l-4 border-l-accent-400">
      {/* Header with tool name and status */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg flex-shrink-0 ${statusVariant === "error" ? "bg-error/10 text-error" :
            statusVariant === "success" ? "bg-success/10 text-success" :
              statusVariant === "running" ? "bg-info/10 text-info" :
                "bg-accent-500/10 text-accent-500"
            }`}>
            {ToolIcon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-ink-800 truncate">{messageContent.name}</span>
            {toolInfo && (
              <span className="text-xs text-muted truncate">{toolInfo.value}</span>
            )}
          </div>
        </div>
        <StatusBadge status={statusVariant} />
      </div>

      {/* Tool details for complex tools */}
      {messageContent.name === "Bash" && (messageContent.input as Record<string, any>)?.command && (
        <div className="mt-2 rounded-lg bg-surface px-3 py-2 overflow-x-auto">
          <code className="text-xs font-mono text-ink-600 whitespace-nowrap">
            {(messageContent.input as Record<string, any>).command}
          </code>
        </div>
      )}

      {messageContent.name === "Task" && (messageContent.input as Record<string, any>)?.description && (
        <div className="mt-2 rounded-lg bg-surface px-3 py-2">
          <p className="text-xs text-ink-600">
            {(messageContent.input as Record<string, any>).description}
          </p>
        </div>
      )}
    </div>
  );
});
