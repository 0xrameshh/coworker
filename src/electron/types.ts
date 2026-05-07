import type { SDKMessage, PermissionResult } from "@anthropic-ai/claude-agent-sdk";

export type ClaudeSettingsEnv = {
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
  ANTHROPIC_DEFAULT_OPUS_MODEL: string;
  ANTHROPIC_DEFAULT_SONNET_MODEL: string;
  ANTHROPIC_MODEL: string;
  API_TIMEOUT_MS: string;
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: string;
};

export type UserPromptMessage = {
  type: "user_prompt";
  prompt: string;
  images?: string[]; // Base64 encoded images
};

export type StreamMessage = SDKMessage | UserPromptMessage;

export type SessionStatus = "idle" | "running" | "completed" | "error";

export type SessionInfo = {
  id: string;
  title: string;
  status: SessionStatus;
  claudeSessionId?: string;
  cwd?: string;
  createdAt: number;
  updatedAt: number;
};

// FD types
export type FdFileInfo = {
  path: string;
  size?: number;
};

export type FdOptions = {
  hidden?: boolean;
  ext?: string;
  type?: "file" | "dir" | "symlink";
  limit?: number;
};

// RG types
export type RgMatch = {
  path: string;
  line: number;
  content: string;
};

export type RgOptions = {
  ext?: string;
  glob?: string;
  context?: number;
  caseSensitive?: boolean;
  limit?: number;
};

// Git types
export type GitStatusType = "Modified" | "Added" | "Deleted" | "Untracked";

export type GitStatusEntry = {
  path: string;
  status: GitStatusType;
};

export type GitCommit = {
  id: string;
  message: string;
  author: string;
  email: string;
  timestamp: number;
};

// Search types (Rust-based SQLite FTS5)
export type SearchResult = {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  snippet: string;
  rank: number;
  timestamp: number;
};

export type SearchMessageInput = {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  timestamp: number;
  metadata?: string;
};

export type SearchStats = {
  messageCount: number;
  sessionCount: number;
};

// Server -> Client events
export type ServerEvent =
  | { type: "stream.message"; payload: { sessionId: string; message: StreamMessage } }
  | { type: "stream.user_prompt"; payload: { sessionId: string; prompt: string; images?: string[] } }
  | { type: "session.status"; payload: { sessionId: string; status: SessionStatus; title?: string; cwd?: string; error?: string } }
  | { type: "session.list"; payload: { sessions: SessionInfo[] } }
  | { type: "session.history"; payload: { sessionId: string; status: SessionStatus; messages: StreamMessage[] } }
  | { type: "session.deleted"; payload: { sessionId: string } }
  | { type: "permission.request"; payload: { sessionId: string; toolUseId: string; toolName: string; input: unknown } }
  | { type: "runner.error"; payload: { sessionId?: string; message: string } }
  // FD events (Rust - fd utility)
  | { type: "fd.find.result"; payload: { files: FdFileInfo[] } }
  | { type: "fd.list.result"; payload: { files: FdFileInfo[] } }
  | { type: "fd.error"; payload: { message: string } }
  // RG events (Rust - ripgrep)
  | { type: "rg.search.result"; payload: { results: RgMatch[] } }
  | { type: "rg.files.result"; payload: { files: string[] } }
  | { type: "rg.error"; payload: { message: string } }
  // Git events (Rust - libgit2)
  | { type: "git.status.result"; payload: { entries: GitStatusEntry[] } }
  | { type: "git.log.result"; payload: { commits: GitCommit[] } }
  | { type: "git.diff.result"; payload: { diff: string } }
  | { type: "git.commit.result"; payload: { commitId: string } }
  | { type: "git.error"; payload: { message: string } };

// IPC Event Payload Mapping - maps IPC channel names to return types
export type EventPayloadMapping = {
  // Statistics
  statistics: any;
  getStaticData: any;

  // Session utilities
  "generate-session-title": string;
  "get-recent-cwds": string[];
  "get-home-dir": string;
  "execute-command": any;
  "select-directory": string | null;
  "select-image": string | null;
  "read-clipboard-image": string | null;

  // App config
  "get-app-config": any;
  "save-app-config": any;
  "add-provider": any;
  "remove-provider": any;

  // Legacy API config
  "get-api-config": any;
  "save-api-config": any;

  // Theme
  "get-theme": "light" | "dark";
  "save-theme": any;
  "theme-changed": "light" | "dark";

  // Full config (onboarding & settings)
  "get-full-config": any;
  "has-completed-onboarding": boolean;
  "complete-onboarding": any;
  "save-user-profile": any;
  "save-ai-profile": any;
  "get-preferences": any;
  "save-preferences": any;

  // File operations
  "read-file": any;
  "write-file": any;
  "list-files": any;
  "get-file-stats": any;
  "open-config-file": void;

  // Native module functions
  "native-read-file": any;
  "native-write-file": any;
  "native-list-dir": any;
  "native-file-exists": boolean;
  "native-search-files": any;
  "native-get-platform": string;
  "native-get-arch": string;

  // Native search functions (Rust-based SQLite FTS5)
  "search-init": { success: boolean; result?: boolean; error?: string };
  "search-index-message": { success: boolean; result?: boolean; error?: string };
  "search-index-messages": { success: boolean; count?: number; error?: string };
  "search-messages": { success: boolean; results?: SearchResult[]; error?: string };
  "search-get-context": { success: boolean; results?: SearchResult[]; error?: string };
  "search-find-similar": { success: boolean; results?: SearchResult[]; error?: string };
  "search-delete-session": { success: boolean; count?: number; error?: string };
  "search-get-stats": { success: boolean; stats?: SearchStats; error?: string };

  // MCP configuration
  "mcp-get-config": { success: boolean; config?: any; error?: string };
  "mcp-save-config": { success: boolean; error?: string };
  "mcp-get-available-tools": { success: boolean; tools?: string[]; error?: string };

  // Developer Context
  "dev-context-load": { success: boolean; config?: any; error?: string };
  "dev-context-save": { success: boolean; error?: string };
  "dev-context-init": { success: boolean; config?: any; error?: string };
  "dev-context-summary": { success: boolean; summary?: any; error?: string };
  "dev-context-detect-tech": { success: boolean; techStack?: string[]; error?: string };
  "dev-context-index-docs": { success: boolean; indexedFiles?: string[]; error?: string };

  // Repository Management
  "dev-context-clone-repo": { success: boolean; error?: string };
  "dev-context-sync-repos": { success: boolean; results?: Record<string, { success: boolean; error?: string }>; error?: string };
  "dev-context-get-repo-status": { success: boolean; status?: Record<string, { exists: boolean; lastModified?: number }>; error?: string };
  "dev-context-search-docs": { success: boolean; results?: any; error?: string };
  "dev-context-get-popular-repos": { success: boolean; repos?: any[]; error?: string };
  "dev-context-add-repo": { success: boolean; config?: any; error?: string };
  "dev-context-remove-repo": { success: boolean; config?: any; error?: string };

  // Rust-accelerated operations
  "rust-list-files": { success: boolean; data?: RustFileInfo[]; error?: string };
  "rust-search": { success: boolean; data?: RustSearchResult; error?: string };
  "rust-find-files": { success: boolean; data?: string[]; error?: string };
  "rust-glob": { success: boolean; data?: string[]; error?: string };
  "rust-read-file": { success: boolean; data?: RustFileContent; error?: string };
  "rust-server-status": { success: boolean; available: boolean };
};

// Rust bridge types
export type RustFileInfo = {
  path: string;
  name: string;
  is_dir: boolean;
  size?: number;
  modified?: number;
};

export type RustFileContent = {
  path: string;
  content: string;
  line_count: number;
};

export type RustSearchMatch = {
  path: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
};

export type RustSearchResult = {
  matches: RustSearchMatch[];
  total_matches: number;
  files_searched: number;
};

// Client -> Server events
export type ClientEvent =
  | { type: "session.start"; payload: { title: string; prompt: string; cwd?: string; allowedTools?: string; images?: string[] } }
  | { type: "session.continue"; payload: { sessionId: string; prompt: string; images?: string[] } }
  | { type: "session.stop"; payload: { sessionId: string } }
  | { type: "session.delete"; payload: { sessionId: string } }
  | { type: "session.list" }
  | { type: "session.history"; payload: { sessionId: string } }
  | { type: "permission.response"; payload: { sessionId: string; toolUseId: string; result: PermissionResult } }
  // FD events (Rust - fd utility)
  | { type: "fd.find"; payload: { root: string; pattern: string; options?: FdOptions } }
  | { type: "fd.list"; payload: { root: string; options?: FdOptions } }
  // RG events (Rust - ripgrep)
  | { type: "rg.search"; payload: { root: string; query: string; options?: RgOptions } }
  | { type: "rg.files"; payload: { root: string; pattern?: string; options?: { ext?: string } } }
  // Git events (Rust - libgit2)
  | { type: "git.status"; payload: { repoPath: string } }
  | { type: "git.log"; payload: { repoPath: string; limit?: number } }
  | { type: "git.diff"; payload: { repoPath: string; filePath?: string } }
  | { type: "git.commit"; payload: { repoPath: string; message: string; files: string[] } };
