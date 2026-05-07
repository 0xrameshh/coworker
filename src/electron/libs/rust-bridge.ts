/**
 * Rust Backend Bridge
 *
 * Manages the Rust server process and provides HTTP client
 * for communicating with it from Electron.
 */

import { spawn, ChildProcess } from "child_process";
import { app } from "electron";
import { join } from "path";
import { existsSync } from "fs";

const RUST_SERVER_PORT = 3141;
const RUST_SERVER_HOST = "127.0.0.1";
const RUST_SERVER_URL = `http://${RUST_SERVER_HOST}:${RUST_SERVER_PORT}`;

let serverProcess: ChildProcess | null = null;
let isServerReady = false;

/**
 * Get the path to the Rust server binary
 */
function getRustServerPath(): string | null {
  // In production, binary should be in resources (check this FIRST)
  if (app.isPackaged) {
    const prodPath = join(process.resourcesPath, "coworker");
    if (existsSync(prodPath)) {
      console.log("[RustBridge] Using production binary:", prodPath);
      return prodPath;
    }
  }

  // In development, use the target/release path
  const devPath = join(process.cwd(), "target", "release", "coworker");
  if (existsSync(devPath)) {
    console.log("[RustBridge] Using development binary:", devPath);
    return devPath;
  }

  console.error("[RustBridge] No Rust binary found!");
  return null;
}

/**
 * Wait for the server to be ready by polling health endpoint
 */
async function waitForServer(maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${RUST_SERVER_URL}/health`);
      if (response.ok) {
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

/**
 * Start the Rust server process
 */
export async function startRustServer(): Promise<boolean> {
  if (serverProcess && isServerReady) {
    console.log("[RustBridge] Server already running");
    return true;
  }

  const serverPath = getRustServerPath();
  if (!serverPath) {
    console.warn("[RustBridge] Rust server binary not found, falling back to Node.js");
    return false;
  }

  console.log("[RustBridge] Starting Rust server:", serverPath);

  const dataDir = app.getPath("userData");

  serverProcess = spawn(serverPath, [
    "--port", String(RUST_SERVER_PORT),
    "--host", RUST_SERVER_HOST,
    "--data-dir", dataDir,
  ], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout?.on("data", (data) => {
    console.log("[RustServer]", data.toString().trim());
  });

  serverProcess.stderr?.on("data", (data) => {
    console.error("[RustServer]", data.toString().trim());
  });

  serverProcess.on("exit", (code) => {
    console.log("[RustBridge] Server exited with code:", code);
    serverProcess = null;
    isServerReady = false;
  });

  serverProcess.on("error", (err) => {
    console.error("[RustBridge] Server error:", err);
    serverProcess = null;
    isServerReady = false;
  });

  // Wait for server to be ready
  isServerReady = await waitForServer();

  if (isServerReady) {
    console.log("[RustBridge] Server ready on port", RUST_SERVER_PORT);
  } else {
    console.error("[RustBridge] Server failed to start");
    stopRustServer();
  }

  return isServerReady;
}

/**
 * Stop the Rust server process
 */
export function stopRustServer(): void {
  if (serverProcess) {
    console.log("[RustBridge] Stopping Rust server");
    serverProcess.kill("SIGTERM");
    serverProcess = null;
    isServerReady = false;
  }
}

/**
 * Check if the Rust server is available
 */
export function isRustServerAvailable(): boolean {
  return isServerReady;
}

// ============ API Client ============

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function rustApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!isServerReady) {
    return { success: false, error: "Rust server not available" };
  }

  try {
    const response = await fetch(`${RUST_SERVER_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// ============ File Operations ============

export interface FileInfo {
  path: string;
  name: string;
  is_dir: boolean;
  size?: number;
  modified?: number;
}

export interface FileContent {
  path: string;
  content: string;
  line_count: number;
}

export async function listFiles(
  root: string,
  maxDepth?: number
): Promise<ApiResponse<FileInfo[]>> {
  return rustApi("/api/files/list", {
    method: "POST",
    body: JSON.stringify({ root, max_depth: maxDepth }),
  });
}

export async function readFile(
  path: string,
  start?: number,
  end?: number
): Promise<ApiResponse<FileContent>> {
  return rustApi("/api/files/read", {
    method: "POST",
    body: JSON.stringify({ path, start, end }),
  });
}

export async function writeFile(
  path: string,
  content: string
): Promise<ApiResponse<void>> {
  return rustApi("/api/files/write", {
    method: "POST",
    body: JSON.stringify({ path, content }),
  });
}

export async function globFiles(
  root: string,
  pattern: string
): Promise<ApiResponse<string[]>> {
  return rustApi("/api/files/glob", {
    method: "POST",
    body: JSON.stringify({ root, pattern }),
  });
}

// ============ Search Operations ============

export interface SearchMatch {
  path: string;
  line_number: number;
  line_content: string;
  match_start: number;
  match_end: number;
}

export interface SearchResult {
  matches: SearchMatch[];
  total_matches: number;
  files_searched: number;
}

export async function search(
  root: string,
  pattern: string,
  options?: {
    case_sensitive?: boolean;
    max_results?: number;
    file_pattern?: string;
  }
): Promise<ApiResponse<SearchResult>> {
  return rustApi("/api/search", {
    method: "POST",
    body: JSON.stringify({ root, pattern, ...options }),
  });
}

export async function findFiles(
  root: string,
  pattern: string,
  maxResults?: number
): Promise<ApiResponse<string[]>> {
  return rustApi("/api/search/find", {
    method: "POST",
    body: JSON.stringify({ root, pattern, max_results: maxResults }),
  });
}

// ============ Session Operations ============

export interface Session {
  id: string;
  title: string;
  status: string;
  cwd?: string;
  claude_session_id?: string;
  created_at: number;
  updated_at: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: string;
  content: string;
  timestamp: number;
}

export async function listSessions(): Promise<ApiResponse<Session[]>> {
  return rustApi("/api/sessions", { method: "GET" });
}

export async function createSession(
  title: string,
  cwd?: string
): Promise<ApiResponse<Session>> {
  return rustApi("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ title, cwd }),
  });
}

export async function getSession(id: string): Promise<ApiResponse<Session | null>> {
  return rustApi(`/api/sessions/${id}`, { method: "GET" });
}

export async function deleteSession(id: string): Promise<ApiResponse<void>> {
  return rustApi(`/api/sessions/${id}`, { method: "DELETE" });
}

export async function getMessages(sessionId: string): Promise<ApiResponse<Message[]>> {
  return rustApi(`/api/sessions/${sessionId}/messages`, { method: "GET" });
}
