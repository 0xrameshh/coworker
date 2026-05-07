import { app, BrowserWindow, ipcMain, dialog, nativeTheme, clipboard, type IpcMainInvokeEvent } from "electron"
import { ipcMainHandle, isDev, DEV_PORT } from "./util.js";
import { getPreloadPath, getUIPath, getIconPath } from "./pathResolver.js";
import { getStaticData, pollResources } from "./test.js";
import { handleClientEvent, sessions } from "./ipc-handlers.js";
import { generateSessionTitle } from "./libs/util.js";
import type { ClientEvent } from "./types.js";
import { loadFullConfig, saveFullConfig, completeOnboarding, getUserProfile, saveUserProfile, getAiProfile, saveAiProfile, getPreferences, savePreferences, loadApiConfig, saveApiConfig, hasCompletedOnboarding, type Theme, type AppConfig, type ProviderConfig, type UserProfile, type AiProfile } from "./libs/config-store.js";
import { shell } from "electron";
import { join, dirname } from "path";
import { homedir } from "os";
import { writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { readFile as readFilePromise, writeFile as writeFilePromise } from "fs/promises";
import { readdir } from "fs/promises";
import "./libs/claude-settings.js";
import * as nativeSearch from "./libs/native-search.js";
import * as developerContext from "./libs/developer-context.js";
import * as rustBridge from "./libs/rust-bridge.js";

app.on("ready", async () => {
    // Start Rust backend server
    const rustServerStarted = await rustBridge.startRustServer();
    if (rustServerStarted) {
        console.log("[main] Rust backend server started successfully");
    } else {
        console.log("[main] Rust backend not available, using Node.js fallback");
    }

    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        webPreferences: {
            preload: getPreloadPath(),
        },
        icon: getIconPath(),
        titleBarStyle: "hiddenInset",
        backgroundColor: "#FAF9F6",
        trafficLightPosition: { x: 15, y: 18 }
    });

    if (isDev()) mainWindow.loadURL(`http://localhost:${DEV_PORT}`)
    else mainWindow.loadFile(getUIPath());

    pollResources(mainWindow);

    ipcMainHandle("getStaticData", () => {
        return getStaticData();
    });

    // Handle client events
    ipcMain.on("client-event", (_, event: ClientEvent) => {
        handleClientEvent(event);
    });

    // Handle session title generation
    ipcMainHandle("generate-session-title", async (_: IpcMainInvokeEvent, userInput: string | null) => {
        return await generateSessionTitle(userInput);
    });

    // Handle recent cwds request
    ipcMainHandle("get-recent-cwds", (_: IpcMainInvokeEvent, limit?: number) => {
        const boundedLimit = limit ? Math.min(Math.max(limit, 1), 20) : 8;
        return sessions().listRecentCwds(boundedLimit);
    });

    // Handle get home directory
    ipcMainHandle("get-home-dir", () => {
        return homedir();
    });

    // Handle command execution
    ipcMainHandle("execute-command", async (_: IpcMainInvokeEvent, payload: { command: string; cwd: string; timeout?: number }) => {
        const { command, cwd, timeout = 30000 } = payload;
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);

            // Change to the specified directory
            process.chdir(cwd);

            const { stdout, stderr } = await execAsync(command, {
                timeout,
                maxBuffer: 1024 * 1024 // 1MB
            });

            return {
                success: true,
                stdout: stdout || '',
                stderr: stderr || '',
                cwd: process.cwd()
            };
        } catch (error: any) {
            // Handle timeout and other errors
            if (error.killed || error.signal === 'SIGTERM') {
                return {
                    success: false,
                    error: 'Command timed out',
                    stdout: error.stdout || '',
                    stderr: error.stderr || ''
                };
            }
            return {
                success: false,
                error: error.message || 'Unknown error',
                stdout: error.stdout || '',
                stderr: error.stderr || ''
            };
        }
    });

    // Handle directory selection
    ipcMainHandle("select-directory", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openDirectory']
        });

        if (result.canceled) {
            return null;
        }

        return result.filePaths[0];
    });

    // Handle image selection for attachments - returns base64 data URL
    ipcMainHandle("select-image", async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }
            ]
        });

        if (result.canceled || !result.filePaths[0]) {
            return null;
        }

        try {
            const filePath = result.filePaths[0];
            const imageBuffer = await readFilePromise(filePath);
            const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
            const mimeType = ext === 'svg' ? 'image/svg+xml' :
                             ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
            const base64 = imageBuffer.toString('base64');
            return `data:${mimeType};base64,${base64}`;
        } catch (error) {
            console.error("Failed to read image file:", error);
            return null;
        }
    });

    // Handle clipboard image read - for paste functionality
    ipcMainHandle("read-clipboard-image", () => {
        try {
            const image = clipboard.readImage();
            if (image.isEmpty()) {
                return null;
            }
            const pngBuffer = image.toPNG();
            const base64 = pngBuffer.toString('base64');
            return `data:image/png;base64,${base64}`;
        } catch (error) {
            console.error("Failed to read clipboard image:", error);
            return null;
        }
    });

    // Handle full AppConfig (multi-provider)
    ipcMainHandle("get-app-config", () => {
        return loadApiConfig();
    });

    ipcMainHandle("save-app-config", (_: IpcMainInvokeEvent, appConfig: AppConfig) => {
        try {
            saveApiConfig(appConfig);
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to save app config:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("add-provider", (_: IpcMainInvokeEvent, provider: ProviderConfig) => {
        try {
            const config = loadApiConfig();
            if (config) {
                const newProviders = [...config.providers, provider];
                saveApiConfig({ ...config, providers: newProviders });
            } else {
                const appConfig: AppConfig = {
                    activeProvider: provider.id,
                    providers: [provider],
                    theme: "system"
                };
                saveApiConfig(appConfig);
            }
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to add provider:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("remove-provider", (_: IpcMainInvokeEvent, providerId: string) => {
        try {
            const config = loadApiConfig();
            if (!config) return { success: false, error: "No config found" };

            if (config.providers.length <= 1) {
                return { success: false, error: "Cannot remove the last provider" };
            }

            const newProviders = config.providers.filter((p: ProviderConfig) => p.id !== providerId);
            let newActiveProvider = config.activeProvider;
            if (config.activeProvider === providerId) {
                newActiveProvider = newProviders[0].id;
            }

            saveApiConfig({
                ...config,
                providers: newProviders,
                activeProvider: newActiveProvider
            });
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to remove provider:", error);
            return { success: false, error: String(error) };
        }
    });

    // Legacy API config handlers (for backward compatibility)
    ipcMainHandle("get-api-config", () => {
        const config = loadApiConfig();
        if (!config) return null;

        const activeProvider = config.providers.find((p: ProviderConfig) => p.id === config.activeProvider);
        if (!activeProvider) return null;

        return {
            apiKey: activeProvider.apiKey,
            baseURL: activeProvider.baseURL,
            model: activeProvider.model,
            apiType: activeProvider.apiType,
            theme: config.theme
        };
    });

    ipcMainHandle("save-api-config", (_: IpcMainInvokeEvent, legacyConfig: {
        apiKey: string;
        baseURL: string;
        model: string;
        apiType?: "anthropic" | "openai-compatible";
        theme?: Theme;
    }) => {
        try {
            const provider: ProviderConfig = {
                id: "default",
                name: "Default Provider",
                apiType: legacyConfig.apiType || "anthropic",
                apiKey: legacyConfig.apiKey,
                baseURL: legacyConfig.baseURL,
                model: legacyConfig.model
            };

            const appConfig: AppConfig = {
                activeProvider: "default",
                providers: [provider],
                theme: legacyConfig.theme
            };

            saveApiConfig(appConfig);
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to save API config:", error);
            return { success: false, error: String(error) };
        }
    });

    // Handle theme
    const getEffectiveTheme = (): "light" | "dark" => {
        const config = loadApiConfig();
        const themePreference = config?.theme ?? "system";
        if (themePreference === "system") {
            return nativeTheme.shouldUseDarkColors ? "dark" : "light";
        }
        return themePreference;
    };

    ipcMainHandle("get-theme", () => {
        return getEffectiveTheme();
    });

    ipcMainHandle("save-theme", (_: IpcMainInvokeEvent, theme: Theme) => {
        try {
            const config = loadApiConfig();
            if (config) {
                saveApiConfig({ ...config, theme });
            } else {
                // Create default config with theme
                const defaultProvider: ProviderConfig = {
                    id: "default",
                    name: "Default Provider",
                    apiType: "anthropic",
                    apiKey: "",
                    baseURL: "",
                    model: ""
                };
                saveApiConfig({
                    activeProvider: "default",
                    providers: [defaultProvider],
                    theme
                });
            }
            const effectiveTheme = getEffectiveTheme();
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("theme-changed", effectiveTheme);
            });
            return { success: true, theme: effectiveTheme };
        } catch (error) {
            console.error("[main] Failed to save theme:", error);
            return { success: false, error: String(error) };
        }
    });

    // Full config handlers (for onboarding and settings)
    ipcMainHandle("get-full-config", () => {
        return loadFullConfig();
    });

    ipcMainHandle("has-completed-onboarding", () => {
        return hasCompletedOnboarding();
    });

    ipcMainHandle("complete-onboarding", () => {
        completeOnboarding();
        return { success: true };
    });

    ipcMainHandle("save-user-profile", (_: IpcMainInvokeEvent, profile: UserProfile) => {
        try {
            saveUserProfile(profile);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("save-ai-profile", (_: IpcMainInvokeEvent, profile: AiProfile) => {
        try {
            saveAiProfile(profile);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("get-preferences", () => {
        return getPreferences();
    });

    ipcMainHandle("save-preferences", (_: IpcMainInvokeEvent, prefs: {
        defaultWorkingDir?: string;
        terminalShell?: string;
        autoSaveConversations?: boolean;
        syntaxHighlighting?: boolean;
        wordWrap?: boolean;
    }) => {
        try {
            savePreferences(prefs);
            return { success: true };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    });

    // File operations for IDE mode
    ipcMainHandle("read-file", async (_: IpcMainInvokeEvent, filePath: string) => {
        try {
            const content = await readFilePromise(filePath, 'utf-8');
            return { success: true, content };
        } catch (error) {
            console.error("[main] Failed to read file:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("write-file", async (_: IpcMainInvokeEvent, filePath: string, content: string) => {
        try {
            await writeFilePromise(filePath, content, 'utf-8');
            return { success: true };
        } catch (error) {
            console.error("[main] Failed to write file:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("list-files", async (_: IpcMainInvokeEvent, dirPath: string) => {
        try {
            const items = readdirSync(dirPath, { withFileTypes: true })
                .filter(dirent => !dirent.name.startsWith('.')) // Skip hidden files
                .map(dirent => ({
                    name: dirent.name,
                    path: join(dirPath, dirent.name),
                    isDirectory: dirent.isDirectory(),
                    isFile: dirent.isFile()
                }))
                .sort((a, b) => {
                    if (a.isDirectory === b.isDirectory) {
                        return a.name.localeCompare(b.name);
                    }
                    return a.isDirectory ? -1 : 1;
                });
            return { success: true, items };
        } catch (error: any) {
            // Return empty list for permission errors instead of logging error
            if (error.code === 'EACCES' || error.code === 'EPERM') {
                return { success: true, items: [] };
            }
            console.error("[main] Failed to list files:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("get-file-stats", async (_: IpcMainInvokeEvent, filePath: string) => {
        try {
            const stats = statSync(filePath);
            return {
                success: true,
                stats: {
                    size: stats.size,
                    isDirectory: stats.isDirectory(),
                    isFile: stats.isFile(),
                    mtime: stats.mtimeMs
                }
            };
        } catch (error) {
            console.error("[main] Failed to get file stats:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("open-config-file", async () => {
        const userDataPath = app.getPath("userData");
        const configPath = join(userDataPath, "coworker.json");

        // Ensure directory exists
        if (!existsSync(userDataPath)) {
            mkdirSync(userDataPath, { recursive: true });
        }

        // Create config file if it doesn't exist
        if (!existsSync(configPath)) {
            const defaultConfig = {
                activeProvider: "default",
                providers: [{
                    id: "default",
                    name: "Default Provider",
                    apiType: "anthropic",
                    apiKey: "",
                    baseURL: "",
                    model: ""
                }],
                theme: "system"
            };
            writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), "utf8");
        }

        // Open the config file
        const error = await shell.openPath(configPath);
        if (error) {
            console.error("[main] Failed to open config file:", error);
            throw new Error("Failed to open config file");
        }
    });

    // Native module function handlers (fast Rust-based operations)
    ipcMainHandle("native-read-file", async (_: IpcMainInvokeEvent, path: string) => {
        try {
            const content = await readFilePromise(path);
            return { success: true, content };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMainHandle("native-write-file", async (_: IpcMainInvokeEvent, path: string, content: string) => {
        try {
            const dir = dirname(path);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            await writeFilePromise(path, content);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMainHandle("native-list-dir", async (_: IpcMainInvokeEvent, path: string) => {
        try {
            const entries = await readdir(path);
            return { success: true, entries: entries.filter((n: string) => !n.startsWith('.')) };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMainHandle("native-file-exists", (_: IpcMainInvokeEvent, path: string) => {
        return existsSync(path);
    });

    ipcMainHandle("native-get-platform", () => {
        return process.platform;
    });

    ipcMainHandle("native-get-arch", () => {
        return process.arch;
    });

    // Native search handlers (Rust-based SQLite FTS5)
    ipcMainHandle("search-init", async () => {
        try {
            const result = await nativeSearch.searchInit();
            return { success: true, result };
        } catch (error) {
            console.error("[main] Search init failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-index-message", async (_: IpcMainInvokeEvent, message: nativeSearch.MessageInput) => {
        try {
            const result = await nativeSearch.searchIndexMessage(message);
            return { success: true, result };
        } catch (error) {
            console.error("[main] Search index message failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-index-messages", async (_: IpcMainInvokeEvent, messages: nativeSearch.MessageInput[]) => {
        try {
            const count = await nativeSearch.searchIndexMessages(messages);
            return { success: true, count };
        } catch (error) {
            console.error("[main] Search index messages failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-messages", async (_: IpcMainInvokeEvent, query: string, limit?: number, sessionId?: string) => {
        try {
            const results = await nativeSearch.searchMessages(query, limit, sessionId);
            return { success: true, results };
        } catch (error) {
            console.error("[main] Search messages failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-get-context", async (_: IpcMainInvokeEvent, sessionId: string, limit?: number) => {
        try {
            const results = await nativeSearch.searchGetContext(sessionId, limit);
            return { success: true, results };
        } catch (error) {
            console.error("[main] Search get context failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-find-similar", async (_: IpcMainInvokeEvent, content: string, limit?: number, excludeSession?: string) => {
        try {
            const results = await nativeSearch.searchFindSimilar(content, limit, excludeSession);
            return { success: true, results };
        } catch (error) {
            console.error("[main] Search find similar failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-delete-session", async (_: IpcMainInvokeEvent, sessionId: string) => {
        try {
            const count = await nativeSearch.searchDeleteSession(sessionId);
            return { success: true, count };
        } catch (error) {
            console.error("[main] Search delete session failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("search-get-stats", async () => {
        try {
            const stats = await nativeSearch.searchGetStats();
            return { success: true, stats };
        } catch (error) {
            console.error("[main] Search get stats failed:", error);
            return { success: false, error: String(error) };
        }
    });

    // MCP configuration handlers
    ipcMainHandle("mcp-get-config", async (_: IpcMainInvokeEvent, cwd?: string) => {
        try {
            const { loadMcpConfig } = await import("./libs/mcp/config.js");
            const config = loadMcpConfig(cwd);
            return { success: true, config };
        } catch (error) {
            console.error("[main] MCP get config failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("mcp-save-config", async (_: IpcMainInvokeEvent, config: any) => {
        try {
            const { saveMcpConfig } = await import("./libs/mcp/config.js");
            saveMcpConfig(config);
            return { success: true };
        } catch (error) {
            console.error("[main] MCP save config failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("mcp-get-available-tools", async (_: IpcMainInvokeEvent, cwd?: string) => {
        try {
            const { getAvailableTools } = await import("./libs/mcp/loader.js");
            const tools = getAvailableTools(cwd);
            return { success: true, tools };
        } catch (error) {
            console.error("[main] MCP get tools failed:", error);
            return { success: false, error: String(error) };
        }
    });

    // Rust-accelerated file operations
    ipcMainHandle("rust-list-files", async (_: IpcMainInvokeEvent, root: string, maxDepth?: number) => {
        if (!rustBridge.isRustServerAvailable()) {
            return { success: false, error: "Rust server not available" };
        }
        return await rustBridge.listFiles(root, maxDepth);
    });

    ipcMainHandle("rust-search", async (_: IpcMainInvokeEvent, root: string, pattern: string, options?: { case_sensitive?: boolean; max_results?: number; file_pattern?: string }) => {
        if (!rustBridge.isRustServerAvailable()) {
            return { success: false, error: "Rust server not available" };
        }
        return await rustBridge.search(root, pattern, options);
    });

    ipcMainHandle("rust-find-files", async (_: IpcMainInvokeEvent, root: string, pattern: string, maxResults?: number) => {
        if (!rustBridge.isRustServerAvailable()) {
            return { success: false, error: "Rust server not available" };
        }
        return await rustBridge.findFiles(root, pattern, maxResults);
    });

    ipcMainHandle("rust-glob", async (_: IpcMainInvokeEvent, root: string, pattern: string) => {
        if (!rustBridge.isRustServerAvailable()) {
            return { success: false, error: "Rust server not available" };
        }
        return await rustBridge.globFiles(root, pattern);
    });

    ipcMainHandle("rust-read-file", async (_: IpcMainInvokeEvent, path: string, start?: number, end?: number) => {
        if (!rustBridge.isRustServerAvailable()) {
            return { success: false, error: "Rust server not available" };
        }
        return await rustBridge.readFile(path, start, end);
    });

    ipcMainHandle("rust-server-status", async () => {
        return {
            success: true,
            available: rustBridge.isRustServerAvailable()
        };
    });

    // Developer Context handlers
    ipcMainHandle("dev-context-load", (_: IpcMainInvokeEvent, projectPath: string) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            return { success: true, config };
        } catch (error) {
            console.error("[main] Dev context load failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-save", (_: IpcMainInvokeEvent, projectPath: string, config: developerContext.CoworkerConfig) => {
        try {
            developerContext.saveProjectConfig(projectPath, config);
            return { success: true };
        } catch (error) {
            console.error("[main] Dev context save failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-init", (_: IpcMainInvokeEvent, projectPath: string) => {
        try {
            const config = developerContext.initializeProjectConfig(projectPath);
            developerContext.saveProjectConfig(projectPath, config);
            return { success: true, config };
        } catch (error) {
            console.error("[main] Dev context init failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-summary", (_: IpcMainInvokeEvent, projectPath: string) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            const summary = developerContext.getContextSummary(config, projectPath);
            return { success: true, summary };
        } catch (error) {
            console.error("[main] Dev context summary failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-detect-tech", (_: IpcMainInvokeEvent, projectPath: string) => {
        try {
            const techStack = developerContext.detectTechStack(projectPath);
            return { success: true, techStack };
        } catch (error) {
            console.error("[main] Tech stack detection failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-index-docs", (_: IpcMainInvokeEvent, projectPath: string, docsPath: string) => {
        try {
            const indexedFiles = developerContext.indexDocsFolder(projectPath, docsPath);
            return { success: true, indexedFiles };
        } catch (error) {
            console.error("[main] Docs indexing failed:", error);
            return { success: false, error: String(error) };
        }
    });

    // Repository management handlers
    ipcMainHandle("dev-context-clone-repo", async (_: IpcMainInvokeEvent, projectPath: string, repo: developerContext.DocRepository) => {
        try {
            const result = await developerContext.cloneRepository(projectPath, repo);
            return { success: result.success, error: result.error };
        } catch (error) {
            console.error("[main] Repo clone failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-sync-repos", async (_: IpcMainInvokeEvent, projectPath: string) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            const result = await developerContext.syncAllRepositories(projectPath, config);
            return { success: result.success, results: result.results };
        } catch (error) {
            console.error("[main] Repos sync failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-get-repo-status", (_: IpcMainInvokeEvent, projectPath: string) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            const status = developerContext.getRepositoryStatus(projectPath, config);
            return { success: true, status };
        } catch (error) {
            console.error("[main] Get repo status failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-search-docs", (_: IpcMainInvokeEvent, projectPath: string, query: string, maxResults?: number) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            const results = developerContext.findDocumentation(projectPath, config, query);
            return { success: true, results };
        } catch (error) {
            console.error("[main] Doc search failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-get-popular-repos", () => {
        return { success: true, repos: developerContext.POPULAR_DOC_REPOS };
    });

    ipcMainHandle("dev-context-add-repo", (_: IpcMainInvokeEvent, projectPath: string, repo: Omit<developerContext.DocRepository, "status">) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            const newConfig = developerContext.addRepository(config, repo);
            developerContext.saveProjectConfig(projectPath, newConfig);
            return { success: true, config: newConfig };
        } catch (error) {
            console.error("[main] Add repo failed:", error);
            return { success: false, error: String(error) };
        }
    });

    ipcMainHandle("dev-context-remove-repo", (_: IpcMainInvokeEvent, projectPath: string, repoName: string) => {
        try {
            const config = developerContext.loadProjectConfig(projectPath);
            const newConfig = developerContext.removeRepository(config, repoName);
            developerContext.saveProjectConfig(projectPath, newConfig);
            return { success: true, config: newConfig };
        } catch (error) {
            console.error("[main] Remove repo failed:", error);
            return { success: false, error: String(error) };
        }
    });

    // Listen to system theme changes
    nativeTheme.on("updated", () => {
        const config = loadApiConfig();
        if (config?.theme === "system") {
            const effectiveTheme = getEffectiveTheme();
            BrowserWindow.getAllWindows().forEach(win => {
                win.webContents.send("theme-changed", effectiveTheme);
            });
        }
    });
});

// Stop Rust server on quit
app.on("before-quit", () => {
    console.log("[main] Stopping Rust backend server...");
    rustBridge.stopRustServer();
});
