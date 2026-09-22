import { memo } from "react";
import type { SDKMessage, PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import type { StreamMessage } from "../types";
import { useAppStore } from "../store/useAppStore";
import {
  AssistantBlockCard,
  UserMessageCard,
  ToolUseCard,
  ToolResult,
  AskUserQuestionCard,
} from "./cards";

// Type definitions
type MessageContent = any;
type ToolResultContent = any;
type PermissionRequest = { toolUseId: string; toolName: string; input: unknown };

export const MessageCard = memo(function MessageCard({
  message,
  isLast = false,
  isRunning = false,
  permissionRequest,
  onPermissionResult
}: {
  message: StreamMessage;
  isLast?: boolean;
  isRunning?: boolean;
  permissionRequest?: PermissionRequest;
  onPermissionResult?: (toolUseId: string, result: PermissionResult) => void;
}) {
  const showIndicator = isLast && isRunning;
  const showDebugMessages = useAppStore(state => state.showDebugMessages);

  if (message.type === "user_prompt") {
    return <UserMessageCard message={message} />;
  }

  const sdkMessage = message as SDKMessage;

  if (sdkMessage.type === "system") {
    // Hide system messages unless debug mode is on
    if (!showDebugMessages) return null;
    return (
      <div className="flex flex-col gap-3 mt-6 animate-fade-in opacity-60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ink-900/5 text-ink-600">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink-600">System Message</span>
        </div>
        <div className="rounded-xl bg-surface-secondary border border-ink-900/10 p-4 overflow-x-auto">
          <pre className="text-xs text-ink-700 font-mono whitespace-pre-wrap">{JSON.stringify(sdkMessage, null, 2)}</pre>
        </div>
      </div>
    );
  }

  if (sdkMessage.type === "result") {
    const isSuccess = sdkMessage.subtype === "success";
    // Hide success results unless debug mode is on
    if (isSuccess && !showDebugMessages) return null;
    return (
      <div className="flex flex-col gap-3 mt-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isSuccess ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isSuccess ? (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </>
              )}
            </svg>
          </div>
          <span className={`text-sm font-semibold ${isSuccess ? 'text-success' : 'text-error'}`}>
            {isSuccess ? 'Session Completed' : 'Session Error'}
          </span>
        </div>
        <div className={`rounded-xl border p-4 overflow-x-auto ${
          isSuccess ? 'bg-success-light border-success/20' : 'bg-error-light border-error/20'
        }`}>
          <pre className={`text-sm font-mono whitespace-pre-wrap ${isSuccess ? 'text-success' : 'text-error'}`}>
            {JSON.stringify(sdkMessage, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (sdkMessage.type === "assistant") {
    const contents = sdkMessage.message.content;
    return (
      <>
        {contents.map((content: MessageContent, idx: number) => {
          const isLastContent = idx === contents.length - 1;
          const contentKey = (content as any).id || `${content.type}-${idx}`;

          if (content.type === "thinking") {
            const thinkingText = content.thinking || '';
            // Only show empty blocks in debug mode
            if (!thinkingText.trim() && !showDebugMessages) return null;
            return (
              <AssistantBlockCard
                key={contentKey}
                title="Thinking"
                text={thinkingText || '(empty)'}
                showIndicator={isLastContent && showIndicator}
                variant="thinking"
              />
            );
          }
          if (content.type === "text") {
            const textContent = content.text || (content as any).value || '';
            // Only show empty blocks in debug mode
            if (!textContent.trim() && !showDebugMessages) return null;
            return (
              <AssistantBlockCard
                key={contentKey}
                title="Assistant"
                text={textContent || '(empty)'}
                showIndicator={isLastContent && showIndicator}
              />
            );
          }
          if (content.type === "tool_use") {
            if (content.name === "AskUserQuestion") {
              return <AskUserQuestionCard key={contentKey} messageContent={content} permissionRequest={permissionRequest} onPermissionResult={onPermissionResult} />;
            }
            return <ToolUseCard key={contentKey} messageContent={content} />;
          }
          return null;
        })}
      </>
    );
  }

  if (sdkMessage.type === "user") {
    const contents = sdkMessage.message.content;
    const blocks = Array.isArray(contents)
      ? contents
      : [{ type: "text", text: contents }];
    return (
      <>
        {blocks.map((content: ToolResultContent | { type: "text"; text: string }, idx: number) => {
          if (content.type === "tool_result") {
            return <ToolResult key={idx} messageContent={content as ToolResultContent} />;
          }
          if (content.type === "text" && "text" in content) {
            return <UserMessageCard key={idx} message={{ type: "user_prompt", prompt: content.text }} />;
          }
          return null;
        })}
      </>
    );
  }

  return null;
});

export { MessageCard as EventCard };
