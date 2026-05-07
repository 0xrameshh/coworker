import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { DecisionPanel } from "../DecisionPanel";

type MessageContent = any;
type PermissionRequest = { toolUseId: string; toolName: string; input: unknown };

type AskUserQuestionInput = {
  questions?: Array<{
    question: string;
    header?: string;
    options?: Array<{ label: string; description?: string }>;
    multiSelect?: boolean;
  }>;
};

const getAskUserQuestionSignature = (input?: AskUserQuestionInput | null) => {
  if (!input?.questions?.length) return "";
  return input.questions.map((question) => {
    const options = (question.options ?? []).map((o) => `${o.label}|${o.description ?? ""}`).join(",");
    return `${question.question}|${question.header ?? ""}|${question.multiSelect ? "1" : "0"}|${options}`;
  }).join("||");
};

interface AskUserQuestionCardProps {
  messageContent: MessageContent;
  permissionRequest?: PermissionRequest;
  onPermissionResult?: (toolUseId: string, result: PermissionResult) => void;
}

export function AskUserQuestionCard({
  messageContent,
  permissionRequest,
  onPermissionResult
}: AskUserQuestionCardProps) {
  if (messageContent.type !== "tool_use") return null;

  const input = messageContent.input as AskUserQuestionInput | null;
  const questions = input?.questions ?? [];
  const currentSignature = getAskUserQuestionSignature(input);
  const requestSignature = getAskUserQuestionSignature(permissionRequest?.input as AskUserQuestionInput | undefined);
  const isActiveRequest = permissionRequest && currentSignature === requestSignature;

  if (isActiveRequest && onPermissionResult) {
    return (
      <div className="mt-4 animate-fade-in">
        <DecisionPanel
          request={permissionRequest}
          onSubmit={(result) => onPermissionResult(permissionRequest.toolUseId, result)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink-900/10 bg-surface-tertiary/50 p-4 mt-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-accent-500/10 text-accent-500">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <span className="text-sm font-medium text-ink-800">Question</span>
      </div>
      {questions.map((q, idx) => (
        <div key={idx} className="pl-9 text-sm text-ink-600">
          <p className="font-medium text-ink-700">{q.question}</p>
          {q.header && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-surface text-muted">
              {q.header}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
