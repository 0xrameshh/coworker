import { memo, useState, useCallback } from "react";
import { StatusDot } from "./StatusBadge";
import { useAppStore } from "../../store/useAppStore";
import { Avatar } from "../Avatar";
import MDContent from "../../render/markdown";

interface AssistantBlockCardProps {
  title: string;
  text: string;
  showIndicator?: boolean;
  variant?: "default" | "thinking";
}

export const AssistantBlockCard = memo(function AssistantBlockCard({
  title,
  text,
  showIndicator = false,
  variant = "default"
}: AssistantBlockCardProps) {
  const aiProfile = useAppStore(s => s.aiProfile);
  const [copied, setCopied] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [text]);

  return (
    <div
      className={`flex items-start gap-3 mt-8 group ${variant === "thinking" ? "opacity-70" : ""}`}
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {/* AI Avatar */}
      <Avatar
        name={aiProfile.name || "Coworker"}
        avatar={aiProfile.avatar}
        size="sm"
        isAI
        className="flex-shrink-0 mt-1"
      />

      {/* Message content */}
      <div className="flex-1 min-w-0">
        {/* Header with name and copy button */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {showIndicator && <StatusDot variant="accent" isActive={true} isVisible={true} />}
            <span className="text-[13px] font-semibold text-ink-600 dark:text-ink-400 uppercase tracking-wide">
              {variant === "thinking" ? "Thinking" : (aiProfile.name || title)}
            </span>
          </div>
          {/* Copy button - shows on hover */}
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              copied
                ? 'bg-success/10 text-success'
                : 'text-ink-400 hover:text-ink-600 dark:text-ink-500 dark:hover:text-ink-300 hover:bg-surface-secondary'
            } ${showCopy ? 'opacity-100' : 'opacity-0'}`}
            title="Copy message"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Message content with better styling */}
        <div className={`rounded-xl border border-ink-900/5 bg-surface/50 dark:bg-surface-secondary/30 p-4 ${
          variant === "thinking" ? "italic text-ink-500 dark:text-ink-400" : ""
        }`}>
          <div className="text-ink-800 dark:text-ink-100">
            <MDContent text={text} />
          </div>
        </div>
      </div>
    </div>
  );
});
