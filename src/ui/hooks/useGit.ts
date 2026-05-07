import { useCallback, useState } from "react";
import type { GitStatusEntry, GitCommit } from "../types";

type GitStatus = "idle" | "loading" | "success" | "error";

export function useGit() {
  const [status, setStatus] = useState<GitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const setupListener = useCallback((
    successType: string,
    onSuccess: (data: unknown) => void,
    onError: (message: string) => void
  ) => {
    const listener = (_event: Event, payload: string) => {
      const event = JSON.parse(payload);

      if (event.type === successType) {
        onSuccess(event.payload);
        setStatus("success");
      } else if (event.type === "git.error") {
        onError(event.payload.message);
        setStatus("error");
      }
    };

    window.addEventListener("server-event", listener as EventListener);

    return () => {
      window.removeEventListener("server-event", listener as EventListener);
    };
  }, []);

  const send = useCallback((event: { type: string; payload: unknown }) => {
    setStatus("loading");
    setError(null);
    window.postMessage(JSON.stringify(event), "*");
  }, []);

  const getStatus = useCallback((repoPath: string): Promise<GitStatusEntry[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("git.status.result", (payload) => {
        resolve((payload as { entries: GitStatusEntry[] }).entries);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "git.status",
        payload: { repoPath }
      });
    });
  }, [send, setupListener]);

  const getLog = useCallback((repoPath: string, limit?: number): Promise<GitCommit[]> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("git.log.result", (payload) => {
        resolve((payload as { commits: GitCommit[] }).commits);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "git.log",
        payload: { repoPath, limit }
      });
    });
  }, [send, setupListener]);

  const getDiff = useCallback((repoPath: string, filePath?: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("git.diff.result", (payload) => {
        resolve((payload as { diff: string }).diff);
        cleanup();
      }, (message) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "git.diff",
        payload: { repoPath, filePath }
      });
    });
  }, [send, setupListener]);

  const commit = useCallback((repoPath: string, message: string, files: string[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      const cleanup = setupListener("git.commit.result", (payload) => {
        resolve((payload as { commitId: string }).commitId);
        cleanup();
      }, (message: string) => {
        setError(message);
        reject(new Error(message));
        cleanup();
      });

      send({
        type: "git.commit",
        payload: { repoPath, message, files }
      });
    });
  }, [send, setupListener]);

  return {
    getStatus,
    getLog,
    getDiff,
    commit,
    status,
    error,
    isLoading: status === "loading"
  };
}
