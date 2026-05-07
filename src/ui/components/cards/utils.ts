import { useState, useEffect } from "react";

// Tool status tracking
export type ToolStatus = "pending" | "running" | "success" | "error";

const toolStatusMap = new Map<string, ToolStatus>();
const toolStatusListeners = new Set<() => void>();

export const setToolStatus = (toolUseId: string | undefined, status: ToolStatus) => {
  if (!toolUseId) return;
  toolStatusMap.set(toolUseId, status);
  toolStatusListeners.forEach((listener) => listener());
};

export const useToolStatus = (toolUseId: string | undefined) => {
  const [status, setStatus] = useState<ToolStatus | undefined>(() =>
    toolUseId ? toolStatusMap.get(toolUseId) : undefined
  );
  useEffect(() => {
    if (!toolUseId) return;
    const handleUpdate = () => setStatus(toolStatusMap.get(toolUseId));
    toolStatusListeners.add(handleUpdate);
    return () => { toolStatusListeners.delete(handleUpdate); };
  }, [toolUseId]);
  return status;
};

export const hasToolStatus = (toolUseId: string): boolean => {
  return toolStatusMap.has(toolUseId);
};

// Helper function to safely convert any value to a string representation
export function safeStringify(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      return String(value);
    }
  }
  return String(value);
}

// Strip line number prefixes from Read tool output (e.g., "   123→" -> "")
export function stripLineNumbers(text: string): string {
  return text.replace(/^\s*\d+→/gm, "");
}

// Extract content from XML-like tags
export function extractTagContent(input: string, tag: string): string | null {
  const match = input.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? match[1] : null;
}

// Constants
export const MAX_VISIBLE_LINES = 5;
