import { useEffect, useState, useCallback } from "react";
import { useGit } from "../hooks/useGit";
import type { GitStatusEntry, GitCommit } from "../types";

interface GitStatusProps {
  repoPath?: string;
  className?: string;
}

const statusColors: Record<string, string> = {
  Modified: "text-yellow-500",
  Added: "text-green-500",
  Deleted: "text-red-500",
  Untracked: "text-gray-400",
};

const statusIcons: Record<string, string> = {
  Modified: "M",
  Added: "+",
  Deleted: "-",
  Untracked: "?",
};

export function GitStatus({ repoPath, className = "" }: GitStatusProps) {
  const [entries, setEntries] = useState<GitStatusEntry[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [diff, setDiff] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"status" | "log" | "diff">("status");
  const [isExpanded, setIsExpanded] = useState(false);
  const { getStatus, getLog, getDiff, isLoading, error } = useGit();

  const refresh = useCallback(async () => {
    if (!repoPath) return;

    try {
      const [statusResult, logResult] = await Promise.all([
        getStatus(repoPath),
        getLog(repoPath, 10),
      ]);
      setEntries(statusResult);
      setCommits(logResult);
    } catch (err) {
      console.error("[GitStatus] Failed to fetch git info:", err);
    }
  }, [repoPath, getStatus, getLog]);

  const fetchDiff = useCallback(async () => {
    if (!repoPath) return;

    try {
      const diffResult = await getDiff(repoPath);
      setDiff(diffResult);
    } catch (err) {
      console.error("[GitStatus] Failed to fetch diff:", err);
    }
  }, [repoPath, getDiff]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (activeTab === "diff") {
      fetchDiff();
    }
  }, [activeTab, fetchDiff]);

  if (!repoPath) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        No repository selected
      </div>
    );
  }

  const hasChanges = entries.length > 0;

  return (
    <div className={`bg-surface-secondary rounded-lg border border-border ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-medium">Git</span>
          {hasChanges && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-500">
              {entries.length} changes
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            refresh();
          }}
          className="p-1 hover:bg-surface-hover rounded"
          title="Refresh"
        >
          <svg
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {(["status", "log", "diff"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-1.5 text-xs capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-surface-hover text-foreground border-b-2 border-accent"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-64 overflow-y-auto">
            {error && (
              <div className="px-3 py-2 text-xs text-red-500">
                {error}
              </div>
            )}

            {activeTab === "status" && (
              <div className="p-2">
                {entries.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    Working tree clean
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {entries.map((entry, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className={`w-4 ${statusColors[entry.status]}`}>
                          {statusIcons[entry.status]}
                        </span>
                        <span className="truncate text-foreground">{entry.path}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "log" && (
              <div className="p-2">
                {commits.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No commits
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {commits.map((commit) => (
                      <li key={commit.id} className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-accent font-mono">{commit.id.slice(0, 7)}</span>
                          <span className="text-muted-foreground truncate">{commit.author}</span>
                        </div>
                        <div className="text-foreground truncate mt-0.5">{commit.message}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === "diff" && (
              <div className="p-2">
                {!diff ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No changes to show
                  </div>
                ) : (
                  <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                    {diff.split("\n").map((line, i) => {
                      let color = "text-foreground";
                      if (line.startsWith("+")) color = "text-green-500";
                      else if (line.startsWith("-")) color = "text-red-500";
                      return (
                        <div key={i} className={color}>
                          {line}
                        </div>
                      );
                    })}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
