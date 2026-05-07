import { useState, useEffect, useRef } from "react";
import { StatusBadge } from "./StatusBadge";
import {
  setToolStatus,
  safeStringify,
  stripLineNumbers,
  extractTagContent,
  MAX_VISIBLE_LINES,
  type ToolStatus
} from "./utils";

type ToolResultContent = any;

interface ToolResultProps {
  messageContent: ToolResultContent;
}

export function ToolResult({ messageContent }: ToolResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isFirstRender = useRef(true);

  if (messageContent.type !== "tool_result") return null;

  const toolUseId = messageContent.tool_use_id;
  const status: ToolStatus = messageContent.is_error ? "error" : "success";
  const isError = messageContent.is_error;
  let lines: string[] = [];

  if (messageContent.is_error) {
    const contentText = typeof messageContent.content === 'string'
      ? messageContent.content
      : (messageContent.content as any)?.text || safeStringify(messageContent.content);
    lines = [extractTagContent(contentText, "tool_use_error") || contentText];
  } else {
    try {
      if (Array.isArray(messageContent.content)) {
        lines = messageContent.content.map((item: any) => {
          if (typeof item === 'string') return item;
          return (item as any)?.text || safeStringify(item);
        }).join("\n").split("\n");
      } else if (typeof messageContent.content === 'string') {
        lines = messageContent.content.split("\n");
      } else {
        const contentText = (messageContent.content as any)?.text || safeStringify(messageContent.content);
        lines = contentText.split("\n");
      }
    } catch { lines = [safeStringify(messageContent)]; }
  }

  // Strip line numbers from Read tool output and join
  const contentText = stripLineNumbers(lines.join("\n"));
  const cleanLines = contentText.split("\n");
  const hasMoreLines = cleanLines.length > MAX_VISIBLE_LINES;
  const visibleContent = hasMoreLines && !isExpanded ? cleanLines.slice(0, MAX_VISIBLE_LINES).join("\n") : contentText;

  useEffect(() => { setToolStatus(toolUseId, status); }, [toolUseId, status]);
  useEffect(() => {
    if (!hasMoreLines || isFirstRender.current) { isFirstRender.current = false; return; }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [hasMoreLines, isExpanded]);

  return (
    <div className="flex flex-col mt-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[11px] font-bold text-ink-500 uppercase tracking-wider">Output</span>
        <StatusBadge status={status} />
      </div>
      <div className={`rounded-lg overflow-hidden border transition-all duration-300 ${isError
        ? "bg-error-light border-error/20"
        : "bg-surface-secondary border-ink-900/5 shadow-sm"
        }`}>
        <div className="p-4">
          <pre className={`text-[13px] leading-relaxed whitespace-pre-wrap break-words font-mono overflow-x-auto ${isError ? "text-error" : "text-ink-700"
            }`}>
            {visibleContent}
          </pre>
        </div>
        {hasMoreLines && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-4 py-2 text-xs font-medium text-accent-500 hover:text-accent-600 bg-ink-900/5 hover:bg-ink-900/10 transition-colors flex items-center justify-center gap-2 border-t border-ink-900/5"
          >
            <span>{isExpanded ? "Show less" : `Show ${cleanLines.length - MAX_VISIBLE_LINES} more lines`}</span>
            <svg className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
