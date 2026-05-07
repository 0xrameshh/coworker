/// <reference types="vite/client" />

import type { ServerEvent } from "../electron/types";

// Search types for window.electron
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

declare global {
  interface Window {
    electron: {
      // Statistics
      subscribeStatistics: (callback: (stats: any) => void) => () => void;
      getStaticData: () => Promise<any>;

      // Agent IPC APIs
      sendClientEvent: (event: any) => void;
      onServerEvent: (callback: (event: ServerEvent) => void) => () => void;

      // Session utilities
      generateSessionTitle: (userInput: string | null) => Promise<string>;
      getRecentCwds: (limit?: number) => Promise<string[]>;
      getHomeDir: () => Promise<string>;
      executeCommand: (payload: { command: string; cwd: string; timeout?: number }) => Promise<any>;
      selectDirectory: () => Promise<string | null>;
      selectImage: () => Promise<string | null>;
      readClipboardImage: () => Promise<string | null>;

      // App config
      getAppConfig: () => Promise<any>;
      saveAppConfig: (config: any) => Promise<any>;
      addProvider: (provider: any) => Promise<any>;
      removeProvider: (providerId: string) => Promise<any>;

      // Legacy API config
      getApiConfig: () => Promise<any>;
      saveApiConfig: (config: any) => Promise<any>;

      // Theme
      getTheme: () => Promise<"light" | "dark">;
      saveTheme: (theme: "light" | "dark" | "system") => Promise<any>;
      onThemeChanged: (callback: (theme: "light" | "dark") => void) => () => void;

      // Full config (onboarding & settings)
      getFullConfig: () => Promise<any>;
      hasCompletedOnboarding: () => Promise<boolean>;
      completeOnboarding: () => Promise<any>;
      saveUserProfile: (profile: { name: string }) => Promise<any>;
      saveAiProfile: (profile: { name: string }) => Promise<any>;
      getPreferences: () => Promise<any>;
      savePreferences: (prefs: any) => Promise<any>;

      // File operations
      readFile: (filePath: string) => Promise<any>;
      writeFile: (filePath: string, content: string) => Promise<any>;
      listFiles: (dirPath: string) => Promise<any>;
      getFileStats: (filePath: string) => Promise<any>;

      openConfigFile: () => Promise<void>;

      // Native module functions
      nativeReadFile: (path: string) => Promise<any>;
      nativeWriteFile: (path: string, content: string) => Promise<any>;
      nativeListDir: (path: string) => Promise<any>;
      nativeFileExists: (path: string) => Promise<boolean>;
      nativeSearchFiles: (root: string, pattern: string, maxDepth?: number) => Promise<any>;
      nativeGetPlatform: () => Promise<string>;
      nativeGetArch: () => Promise<string>;

      // Native search functions (Rust-based SQLite FTS5)
      searchInit: () => Promise<{ success: boolean; result?: boolean; error?: string }>;
      searchIndexMessage: (message: SearchMessageInput) => Promise<{ success: boolean; result?: boolean; error?: string }>;
      searchIndexMessages: (messages: SearchMessageInput[]) => Promise<{ success: boolean; count?: number; error?: string }>;
      searchMessages: (query: string, limit?: number, sessionId?: string) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
      searchGetContext: (sessionId: string, limit?: number) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
      searchFindSimilar: (content: string, limit?: number, excludeSession?: string) => Promise<{ success: boolean; results?: SearchResult[]; error?: string }>;
      searchDeleteSession: (sessionId: string) => Promise<{ success: boolean; count?: number; error?: string }>;
      searchGetStats: () => Promise<{ success: boolean; stats?: SearchStats; error?: string }>;

      // MCP configuration
      mcpGetConfig: (cwd?: string) => Promise<{ success: boolean; config?: McpConfig; error?: string }>;
      mcpSaveConfig: (config: McpConfig) => Promise<{ success: boolean; error?: string }>;
      mcpGetAvailableTools: (cwd?: string) => Promise<{ success: boolean; tools?: string[]; error?: string }>;

      // Developer Context
      devContextLoad: (projectPath: string) => Promise<{ success: boolean; config?: DeveloperConfig; error?: string }>;
      devContextSave: (projectPath: string, config: DeveloperConfig) => Promise<{ success: boolean; error?: string }>;
      devContextInit: (projectPath: string) => Promise<{ success: boolean; config?: DeveloperConfig; error?: string }>;
      devContextSummary: (projectPath: string) => Promise<{ success: boolean; summary?: DeveloperContextSummary; error?: string }>;
      devContextDetectTech: (projectPath: string) => Promise<{ success: boolean; techStack?: string[]; error?: string }>;
      devContextIndexDocs: (projectPath: string, docsPath: string) => Promise<{ success: boolean; indexedFiles?: string[]; error?: string }>;

      // Repository Management
      devContextCloneRepo: (projectPath: string, repo: DocRepository) => Promise<{ success: boolean; error?: string }>;
      devContextSyncRepos: (projectPath: string) => Promise<{ success: boolean; results?: Record<string, { success: boolean; error?: string }>; error?: string }>;
      devContextGetRepoStatus: (projectPath: string) => Promise<{ success: boolean; status?: Record<string, RepoStatus>; error?: string }>;
      devContextSearchDocs: (projectPath: string, query: string, maxResults?: number) => Promise<{ success: boolean; results?: DocSearchResults; error?: string }>;
      devContextGetPopularRepos: () => Promise<{ success: boolean; repos?: PopularRepo[]; error?: string }>;
      devContextAddRepo: (projectPath: string, repo: Omit<DocRepository, "status">) => Promise<{ success: boolean; config?: DeveloperConfig; error?: string }>;
      devContextRemoveRepo: (projectPath: string, repoName: string) => Promise<{ success: boolean; config?: DeveloperConfig; error?: string }>;
    };
  }
}

// MCP types
interface McpServerConfig {
  id: string;
  name: string;
  enabled: boolean;
  type: "builtin" | "stdio" | "sse";
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
  description?: string;
}

interface McpConfig {
  version: number;
  servers: McpServerConfig[];
}

// Developer Context types
interface DeveloperMethodology {
  maxFileLines: number;
  testAfterEdit: boolean;
  cleanFolderStructure: boolean;
  customRules: string[];
}

interface DocRepository {
  name: string;
  url: string;
  branch: string;
  sparsePaths: string[];
  status: "pending" | "cloning" | "ready" | "error";
  lastUpdated?: number;
  error?: string;
}

interface DocsContext {
  docsPath: string;
  useContext7: boolean;
  indexedFiles: string[];
  packages: string[];
  repositories: DocRepository[];
}

interface ProjectContext {
  techStack: string[];
  importantFiles: string[];
  filePatterns: string[];
}

interface DeveloperProfile {
  name: string;
  methodology: DeveloperMethodology;
  docs: DocsContext;
  project: ProjectContext;
  aiInstructions: string;
  customSystemPrompt: string;
}

interface DeveloperConfig {
  version: string;
  profile: DeveloperProfile;
}

interface DeveloperContextSummary {
  techStack: string[];
  docsCount: number;
  packagesCount: number;
  rulesCount: number;
  hasCustomInstructions: boolean;
}

interface DocSearchResult {
  file: string;
  content: string;
  relevance: number;
  lineNumber?: number;
}

interface DocSearchResults {
  localResults: DocSearchResult[];
  suggestContext7: boolean;
  context7Packages: string[];
}

interface RepoStatus {
  exists: boolean;
  lastModified?: number;
}

interface PopularRepo {
  name: string;
  url: string;
  branch: string;
  sparsePaths: string[];
}
