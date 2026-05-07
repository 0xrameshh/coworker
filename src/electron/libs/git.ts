// Native Git module wrapper
// Uses Rust-based libgit2 for fast git operations

import { join } from "path";
import { app } from "electron";

// Types matching Rust exports
export type GitStatusType = "Modified" | "Added" | "Deleted" | "Untracked";

export interface GitStatusEntry {
  path: string;
  status: GitStatusType;
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  email: string;
  timestamp: number;
}

// Native module type definition (extended)
interface NativeGitModule {
  gitStatusEntries: (repoPath: string) => Promise<GitStatusEntry[]>;
  gitLogEntries: (repoPath: string, limit: number | null) => Promise<GitCommit[]>;
  gitDiffText: (repoPath: string, filePath: string | null) => Promise<string>;
  gitCommitFiles: (repoPath: string, message: string, files: string[]) => Promise<string>;
}

// Dynamically import the native module
let nativeModule: NativeGitModule | null = null;

async function getNative(): Promise<NativeGitModule> {
  if (nativeModule) return nativeModule;

  try {
    // Try to load the native module
    const modulePath = join(app.getAppPath(), "native", "index.js");
    const mod = await import(modulePath);
    nativeModule = mod as NativeGitModule;
    return nativeModule;
  } catch (error) {
    console.error("[native-git] Failed to load native module:", error);
    throw new Error("Native module not available");
  }
}

/**
 * Get git status for a repository
 */
export async function gitStatus(repoPath: string): Promise<GitStatusEntry[]> {
  const native = await getNative();
  return native.gitStatusEntries(repoPath);
}

/**
 * Get git log (commit history) for a repository
 */
export async function gitLog(repoPath: string, limit?: number): Promise<GitCommit[]> {
  const native = await getNative();
  return native.gitLogEntries(repoPath, limit ?? null);
}

/**
 * Get git diff for a repository or specific file
 */
export async function gitDiff(repoPath: string, filePath?: string): Promise<string> {
  const native = await getNative();
  return native.gitDiffText(repoPath, filePath ?? null);
}

/**
 * Commit files with a message
 */
export async function gitCommit(repoPath: string, message: string, files: string[]): Promise<string> {
  const native = await getNative();
  return native.gitCommitFiles(repoPath, message, files);
}
