// Global type definitions for Electron IPC

// Statistics type (used by test.ts)
interface Statistics {
  cpuUsage: number;
  ramUsage: number;
  storageData: number;
}

interface StaticData {
  totalStorage: number;
  cpuModel: string;
  totalMemoryGB: number;
}

type UnsubscribeFunction = () => void;

// Search types
interface SearchResult {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  snippet: string;
  rank: number;
  timestamp: number;
}

interface SearchMessageInput {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  timestamp: number;
  metadata?: string;
}

interface SearchStats {
  messageCount: number;
  sessionCount: number;
}

// IPC Event payload mapping
interface EventPayloadMapping {
  // Statistics
  statistics: Statistics;
  getStaticData: StaticData;
  
  // Session
  "generate-session-title": string;
  "get-recent-cwds": string[];
  "get-home-dir": string;
  "execute-command": { success: boolean; stdout?: string; stderr?: string; error?: string; cwd?: string };
  "select-directory": string | null;
  "select-image": string | null;
  "read-clipboard-image": string | null;
  
  // App config
  "get-app-config": any;
  "save-app-config": { success: boolean; error?: string };
  "add-provider": { success: boolean; error?: string };
  "remove-provider": { success: boolean; error?: string };
  
  // Legacy API config
  "get-api-config": any;
  "save-api-config": { success: boolean; error?: string };
  
  // Theme
  "get-theme": "light" | "dark";
  "save-theme": { success: boolean; theme?: "light" | "dark"; error?: string };
  
  // Full config
  "get-full-config": any;
  "has-completed-onboarding": boolean;
  "complete-onboarding": { success: boolean };
  "save-user-profile": { success: boolean; error?: string };
  "save-ai-profile": { success: boolean; error?: string };
  "get-preferences": any;
  "save-preferences": { success: boolean; error?: string };
  
  // File operations
  "read-file": { success: boolean; content?: string; error?: string };
  "write-file": { success: boolean; error?: string };
  "list-files": { success: boolean; items?: any[]; error?: string };
  "get-file-stats": { success: boolean; stats?: any; error?: string };
  "open-config-file": void;
  
  // Native module
  "native-read-file": { success: boolean; content?: string; error?: string };
  "native-write-file": { success: boolean; error?: string };
  "native-list-dir": { success: boolean; entries?: string[]; error?: string };
  "native-file-exists": boolean;
  "native-search-files": any;
  "native-get-platform": string;
  "native-get-arch": string;
  
  // Native search (Rust-based SQLite FTS5)
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
  "mcp-get-available-tools": { success: boolean; tools?: any[]; error?: string };

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
}

// Rust bridge types
interface RustFileInfo {
  path: string;
  name: string;
  is_dir: boolean;
  size?: number;
  modified?: number;
}

interface RustFileContent {
  path: string;
  content: string;
  line_count: number;
}

interface RustSearchMatch {
  path: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
}

interface RustSearchResult {
  matches: RustSearchMatch[];
  total_matches: number;
  files_searched: number;
}

// Window.electron type
interface ElectronAPI {
  subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
  getStaticData: () => Promise<StaticData>;
  sendClientEvent: (event: any) => void;
  onServerEvent: (callback: (event: any) => void) => UnsubscribeFunction;
  generateSessionTitle: (userInput: string | null) => Promise<string>;
  getRecentCwds: (limit?: number) => Promise<string[]>;
  getHomeDir: () => Promise<string>;
  executeCommand: (payload: { command: string; cwd: string; timeout?: number }) => Promise<any>;
  selectDirectory: () => Promise<string | null>;
  selectImage: () => Promise<string | null>;
  readClipboardImage: () => Promise<string | null>;
  getAppConfig: () => Promise<any>;
  saveAppConfig: (config: any) => Promise<any>;
  addProvider: (provider: any) => Promise<any>;
  removeProvider: (providerId: string) => Promise<any>;
  getApiConfig: () => Promise<any>;
  saveApiConfig: (config: any) => Promise<any>;
  getTheme: () => Promise<"light" | "dark">;
  saveTheme: (theme: "light" | "dark" | "system") => Promise<any>;
  onThemeChanged: (callback: (theme: "light" | "dark") => void) => UnsubscribeFunction;
  getFullConfig: () => Promise<any>;
  hasCompletedOnboarding: () => Promise<boolean>;
  completeOnboarding: () => Promise<any>;
  saveUserProfile: (profile: { name: string }) => Promise<any>;
  saveAiProfile: (profile: { name: string }) => Promise<any>;
  getPreferences: () => Promise<any>;
  savePreferences: (prefs: any) => Promise<any>;
  readFile: (filePath: string) => Promise<any>;
  writeFile: (filePath: string, content: string) => Promise<any>;
  listFiles: (dirPath: string) => Promise<any>;
  getFileStats: (filePath: string) => Promise<any>;
  openConfigFile: () => Promise<void>;
  nativeReadFile: (path: string) => Promise<any>;
  nativeWriteFile: (path: string, content: string) => Promise<any>;
  nativeListDir: (path: string) => Promise<any>;
  nativeFileExists: (path: string) => Promise<boolean>;
  nativeSearchFiles: (root: string, pattern: string, maxDepth?: number) => Promise<any>;
  nativeGetPlatform: () => Promise<string>;
  nativeGetArch: () => Promise<string>;
  
  // Native search
  searchInit: () => Promise<{ success: boolean; result?: boolean; error?: string }>;
  searchIndexMessage: (message: SearchMessageInput) => Promise<{ success: boolean; result?: boolean; error?: string }>;
  searchIndexMessages: (messages: SearchMessageInput[]) => Promise<{ success: boolean; count?: number; error?: string }>;
  searchMessages: (query: string, limit?: number, sessionId?: string) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
  searchGetContext: (sessionId: string, limit?: number) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
  searchFindSimilar: (content: string, limit?: number, excludeSession?: string) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
  searchDeleteSession: (sessionId: string) => Promise<{ success: boolean; count?: number; error?: string }>;
  searchGetStats: () => Promise<{ success: boolean; stats?: SearchStats; error?: string }>;

  // MCP configuration
  mcpGetConfig: (cwd?: string) => Promise<{ success: boolean; config?: any; error?: string }>;
  mcpSaveConfig: (config: any) => Promise<{ success: boolean; error?: string }>;
  mcpGetAvailableTools: (cwd?: string) => Promise<{ success: boolean; tools?: any[]; error?: string }>;

  // Developer Context
  devContextLoad: (projectPath: string) => Promise<{ success: boolean; config?: any; error?: string }>;
  devContextSave: (projectPath: string, config: any) => Promise<{ success: boolean; error?: string }>;
  devContextInit: (projectPath: string) => Promise<{ success: boolean; config?: any; error?: string }>;
  devContextSummary: (projectPath: string) => Promise<{ success: boolean; summary?: any; error?: string }>;
  devContextDetectTech: (projectPath: string) => Promise<{ success: boolean; techStack?: string[]; error?: string }>;
  devContextIndexDocs: (projectPath: string, docsPath: string) => Promise<{ success: boolean; indexedFiles?: string[]; error?: string }>;

  // Repository Management
  devContextCloneRepo: (projectPath: string, repo: any) => Promise<{ success: boolean; error?: string }>;
  devContextSyncRepos: (projectPath: string) => Promise<{ success: boolean; results?: Record<string, { success: boolean; error?: string }>; error?: string }>;
  devContextGetRepoStatus: (projectPath: string) => Promise<{ success: boolean; status?: Record<string, { exists: boolean; lastModified?: number }>; error?: string }>;
  devContextSearchDocs: (projectPath: string, query: string, maxResults?: number) => Promise<{ success: boolean; results?: any; error?: string }>;
  devContextGetPopularRepos: () => Promise<{ success: boolean; repos?: any[]; error?: string }>;
  devContextAddRepo: (projectPath: string, repo: any) => Promise<{ success: boolean; config?: any; error?: string }>;
  devContextRemoveRepo: (projectPath: string, repoName: string) => Promise<{ success: boolean; config?: any; error?: string }>;

  // Rust-accelerated operations
  rustListFiles: (root: string, maxDepth?: number) => Promise<{ success: boolean; data?: RustFileInfo[]; error?: string }>;
  rustSearch: (root: string, pattern: string, options?: { case_sensitive?: boolean; max_results?: number; file_pattern?: string }) => Promise<{ success: boolean; data?: RustSearchResult; error?: string }>;
  rustFindFiles: (root: string, pattern: string, maxResults?: number) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  rustGlob: (root: string, pattern: string) => Promise<{ success: boolean; data?: string[]; error?: string }>;
  rustReadFile: (path: string, start?: number, end?: number) => Promise<{ success: boolean; data?: RustFileContent; error?: string }>;
  rustServerStatus: () => Promise<{ success: boolean; available: boolean }>;
}

interface Window {
  electron: ElectronAPI;
}
