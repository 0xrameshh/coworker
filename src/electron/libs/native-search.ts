// Native search module wrapper
// Uses Rust-based SQLite FTS5 for fast full-text search

import { join } from "path";
import { app } from "electron";

// Native module type definition
interface NativeModule {
  searchInit: () => boolean;
  searchIndexMessage: (message: MessageInput) => boolean;
  searchIndexMessages: (messages: MessageInput[]) => number;
  searchMessages: (query: string, limit: number | null, sessionId: string | null) => SearchResult[];
  searchGetContext: (sessionId: string, limit: number | null) => SearchResult[];
  searchFindSimilar: (content: string, limit: number | null, excludeSession: string | null) => SearchResult[];
  searchDeleteSession: (sessionId: string) => number;
  searchGetStats: () => string;
}

// Dynamically import the native module
let nativeModule: NativeModule | null = null;

async function getNative(): Promise<NativeModule> {
  if (nativeModule) return nativeModule;

  try {
    // Try to load the native module
    const modulePath = join(app.getAppPath(), "native", "index.js");
    const mod = await import(modulePath);
    nativeModule = mod as NativeModule;
    return nativeModule;
  } catch (error) {
    console.error("[native-search] Failed to load native module:", error);
    throw new Error("Native module not available");
  }
}

export interface SearchResult {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  snippet: string;
  rank: number;
  timestamp: number;
}

export interface MessageInput {
  id: string;
  sessionId: string;
  role: string;
  content: string;
  timestamp: number;
  metadata?: string;
}

/**
 * Initialize the search database
 */
export async function searchInit(): Promise<boolean> {
  const native = await getNative();
  return native.searchInit();
}

/**
 * Index a single message for search
 */
export async function searchIndexMessage(message: MessageInput): Promise<boolean> {
  const native = await getNative();
  return native.searchIndexMessage(message);
}

/**
 * Index multiple messages at once (batch operation)
 */
export async function searchIndexMessages(messages: MessageInput[]): Promise<number> {
  const native = await getNative();
  return native.searchIndexMessages(messages);
}

/**
 * Full-text search across all messages
 */
export async function searchMessages(
  query: string,
  limit?: number,
  sessionId?: string
): Promise<SearchResult[]> {
  const native = await getNative();
  return native.searchMessages(query, limit ?? null, sessionId ?? null);
}

/**
 * Get recent messages for context
 */
export async function searchGetContext(
  sessionId: string,
  limit?: number
): Promise<SearchResult[]> {
  const native = await getNative();
  return native.searchGetContext(sessionId, limit ?? null);
}

/**
 * Find similar messages using FTS5 ranking
 */
export async function searchFindSimilar(
  content: string,
  limit?: number,
  excludeSession?: string
): Promise<SearchResult[]> {
  const native = await getNative();
  return native.searchFindSimilar(content, limit ?? null, excludeSession ?? null);
}

/**
 * Delete all messages for a session
 */
export async function searchDeleteSession(sessionId: string): Promise<number> {
  const native = await getNative();
  return native.searchDeleteSession(sessionId);
}

/**
 * Get search statistics
 */
export async function searchGetStats(): Promise<{ messageCount: number; sessionCount: number }> {
  const native = await getNative();
  const stats = native.searchGetStats();
  return JSON.parse(stats);
}
