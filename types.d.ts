type Statistics = {
    cpuUsage: number;
    ramUsage: number;
    storageData: number;
}

type StaticData = {
    totalStorage: number;
    cpuModel: string;
    totalMemoryGB: number;
}

type UnsubscribeFunction = () => void;

type Theme = "light" | "dark" | "system";

type ProviderConfig = {
    id: string;
    name: string;
    apiType: "anthropic" | "openai-compatible";
    apiKey: string;
    baseURL: string;
    model: string;
};

type AppConfig = {
    activeProvider: string;
    providers: ProviderConfig[];
    theme?: Theme;
    themePreset?: string;
    accentColor?: string;
    customAccentColor?: string;
};

type AvatarType = "initials" | "emoji";

type Avatar = {
    type: AvatarType;
    value: string;
};

type UserProfile = {
    name: string;
    avatar?: Avatar;
};

type AiProfile = {
    name: string;
    avatar?: Avatar;
    personality?: "professional" | "casual" | "technical" | "creative";
};

type AppPreferences = {
    defaultWorkingDir: string;
    terminalShell: string;
    autoSaveConversations: boolean;
    syntaxHighlighting: boolean;
    wordWrap: boolean;
};

type FullConfig = {
    version: string;
    hasCompletedOnboarding: boolean;
    userProfile: UserProfile;
    aiProfile: AiProfile;
    preferences: AppPreferences;
    api: AppConfig;
};

// Developer Context types
type DeveloperMethodology = {
    maxFileLines: number;
    testAfterEdit: boolean;
    cleanFolderStructure: boolean;
    customRules: string[];
};

type DocRepository = {
    name: string;
    url: string;
    branch: string;
    sparsePaths: string[];
    status: "pending" | "cloning" | "ready" | "error";
    lastUpdated?: number;
    error?: string;
};

type DocsContext = {
    docsPath: string;
    useContext7: boolean;
    indexedFiles: string[];
    packages: string[];
    repositories?: DocRepository[];
};

type ProjectContext = {
    techStack: string[];
    importantFiles: string[];
    filePatterns: string[];
};

type DeveloperProfile = {
    name: string;
    methodology: DeveloperMethodology;
    docs: DocsContext;
    project: ProjectContext;
    aiInstructions: string;
    customSystemPrompt: string;
};

type DeveloperConfig = {
    version: string;
    profile: DeveloperProfile;
};

type DeveloperContextSummary = {
    techStack: string[];
    docsCount: number;
    packagesCount: number;
    rulesCount: number;
    hasCustomInstructions: boolean;
};

type DocSearchResult = {
    file: string;
    content: string;
    relevance: number;
    lineNumber?: number;
};

type DocSearchResults = {
    localResults: DocSearchResult[];
    suggestContext7: boolean;
    context7Packages: string[];
};

type RepoStatus = {
    exists: boolean;
    lastModified?: number;
};

type PopularRepo = {
    name: string;
    url: string;
    branch: string;
    sparsePaths: string[];
};

type EventPayloadMapping = {
    statistics: Statistics;
    getStaticData: StaticData;
    "generate-session-title": string;
    "get-recent-cwds": string[];
    "get-home-dir": string;
    "execute-command": { success: boolean; stdout?: string; stderr?: string; error?: string; cwd?: string };
    "select-directory": string | null;
    "select-image": string | null;

    // Multi-provider APIs
    "get-app-config": AppConfig | null;
    "save-app-config": { success: boolean; error?: string };
    "add-provider": { success: boolean; error?: string };
    "remove-provider": { success: boolean; error?: string };
    // Legacy single-provider APIs
    "get-api-config": { apiKey: string; baseURL: string; model: string; apiType?: "anthropic" | "openai-compatible"; theme?: Theme } | null;
    "save-api-config": { success: boolean; error?: string };
    "get-theme": "light" | "dark";
    "save-theme": { success: boolean; error?: string; theme?: "light" | "dark" };
    // Full config APIs (onboarding & settings)
    "get-full-config": FullConfig;
    "has-completed-onboarding": boolean;
    "complete-onboarding": { success: boolean };
    "save-user-profile": { success: boolean; error?: string };
    "save-ai-profile": { success: boolean; error?: string };
    "get-preferences": AppPreferences;
    "save-preferences": { success: boolean; error?: string };
    // File operations for IDE mode
    "read-file": { success: boolean; content?: string; error?: string };
    "write-file": { success: boolean; error?: string };
    "list-files": { success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>; error?: string };
    "get-file-stats": { success: boolean; stats?: { size: number; isDirectory: boolean; isFile: boolean; mtime: number }; error?: string };
    "open-config-file": void;
    // Native fast operations (Rust-based)
    "native-read-file": { success: boolean; content?: string; error?: string };
    "native-write-file": { success: boolean; error?: string };
    "native-list-dir": { success: boolean; entries?: string[]; error?: string };
    "native-file-exists": boolean;
    "native-search-files": string[];
    "native-get-platform": string;
    "native-get-arch": string;
    // Clipboard operations
    "read-clipboard-image": string | null;
    // Developer Context
    "dev-context-load": { success: boolean; config?: DeveloperConfig; error?: string };
    "dev-context-save": { success: boolean; error?: string };
    "dev-context-init": { success: boolean; config?: DeveloperConfig; error?: string };
    "dev-context-summary": { success: boolean; summary?: DeveloperContextSummary; error?: string };
    "dev-context-detect-tech": { success: boolean; techStack?: string[]; error?: string };
    "dev-context-index-docs": { success: boolean; indexedFiles?: string[]; error?: string };
    "dev-context-clone-repo": { success: boolean; error?: string };
    "dev-context-sync-repos": { success: boolean; results?: Record<string, { success: boolean; error?: string }>; error?: string };
    "dev-context-get-repo-status": { success: boolean; status?: Record<string, RepoStatus>; error?: string };
    "dev-context-search-docs": { success: boolean; results?: DocSearchResults; error?: string };
    "dev-context-get-popular-repos": { success: boolean; repos?: PopularRepo[]; error?: string };
    "dev-context-add-repo": { success: boolean; config?: DeveloperConfig; error?: string };
    "dev-context-remove-repo": { success: boolean; config?: DeveloperConfig; error?: string };
}

interface Window {
    electron: {
        subscribeStatistics: (callback: (statistics: Statistics) => void) => UnsubscribeFunction;
        getStaticData: () => Promise<StaticData>;
        // Agent IPC APIs
        sendClientEvent: (event: any) => void;
        onServerEvent: (callback: (event: any) => void) => UnsubscribeFunction;
        generateSessionTitle: (userInput: string | null) => Promise<string>;
        getRecentCwds: (limit?: number) => Promise<string[]>;
        getHomeDir: () => Promise<string>;
        executeCommand: (payload: { command: string; cwd: string; timeout?: number }) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string; cwd?: string }>;
        selectDirectory: () => Promise<string | null>;
        selectImage: () => Promise<string | null>;

        // Multi-provider APIs
        getAppConfig: () => Promise<AppConfig | null>;
        saveAppConfig: (config: AppConfig) => Promise<{ success: boolean; error?: string }>;
        addProvider: (provider: ProviderConfig) => Promise<{ success: boolean; error?: string }>;
        removeProvider: (providerId: string) => Promise<{ success: boolean; error?: string }>;
        // Legacy single-provider APIs
        getApiConfig: () => Promise<{ apiKey: string; baseURL: string; model: string; apiType?: "anthropic" | "openai-compatible"; theme?: Theme } | null>;
        saveApiConfig: (config: { apiKey: string; baseURL: string; model: string; apiType?: "anthropic" | "openai-compatible"; theme?: Theme }) => Promise<{ success: boolean; error?: string }>;
        // Theme APIs
        getTheme: () => Promise<"light" | "dark">;
        saveTheme: (theme: Theme) => Promise<{ success: boolean; error?: string; theme?: "light" | "dark" }>;
        onThemeChanged: (callback: (theme: "light" | "dark") => void) => UnsubscribeFunction;
        // Full config APIs (onboarding & settings)
        getFullConfig: () => Promise<FullConfig>;
        hasCompletedOnboarding: () => Promise<boolean>;
        completeOnboarding: () => Promise<{ success: boolean }>;
        saveUserProfile: (profile: UserProfile) => Promise<{ success: boolean; error?: string }>;
        saveAiProfile: (profile: AiProfile) => Promise<{ success: boolean; error?: string }>;
        getPreferences: () => Promise<AppPreferences>;
        savePreferences: (prefs: Partial<AppPreferences>) => Promise<{ success: boolean; error?: string }>;
        // File operations for IDE mode
        readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        listFiles: (dirPath: string) => Promise<{ success: boolean; items?: Array<{ name: string; path: string; isDirectory: boolean; isFile: boolean }>; error?: string }>;
        getFileStats: (filePath: string) => Promise<{ success: boolean; stats?: { size: number; isDirectory: boolean; isFile: boolean; mtime: number }; error?: string }>;
        openConfigFile: () => Promise<void>;
        // Native fast operations (Rust-based, no subprocess)
        nativeReadFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
        nativeWriteFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
        nativeListDir: (path: string) => Promise<{ success: boolean; entries?: string[]; error?: string }>;
        nativeFileExists: (path: string) => Promise<boolean>;
        nativeSearchFiles: (root: string, pattern: string, maxDepth?: number) => Promise<string[]>;
        nativeGetPlatform: () => Promise<string>;
        nativeGetArch: () => Promise<string>;
        // Clipboard operations
        readClipboardImage: () => Promise<string | null>;
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
    }
}
