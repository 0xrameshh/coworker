import { useCallback } from "react";
import type { ClientEvent } from "../types";
import { useAppStore, useShallow } from "../store/useAppStore";

const DEFAULT_ALLOWED_TOOLS = "Read,Edit,Bash";

// Single selector with shallow comparison to prevent multiple re-renders
function usePromptActionsState() {
  return useAppStore(useShallow((state) => ({
    cwd: state.cwd,
    activeSessionId: state.activeSessionId,
    sessions: state.sessions,
    setPendingStart: state.setPendingStart,
    setGlobalError: state.setGlobalError
  })));
}

export function usePromptActions(sendEvent: (event: ClientEvent) => void) {
  const { cwd, activeSessionId, sessions, setPendingStart, setGlobalError } = usePromptActionsState();

  const activeSession = activeSessionId ? sessions[activeSessionId] : undefined;
  const isRunning = activeSession?.status === "running";

  // Read prompt directly from store to avoid recreating callback on every keystroke
  const handleSend = useCallback(async (currentPrompt: string, images?: string[]) => {
    if (!currentPrompt.trim() && (!images || images.length === 0)) {
      setGlobalError("Please enter a prompt to start a session.");
      return;
    }

    if (!activeSessionId) {
      let title = "";
      try {
        setPendingStart(true);
        title = await window.electron.generateSessionTitle(currentPrompt);
      } catch (error) {
        console.error(error);
        setPendingStart(false);
        setGlobalError("Failed to get session title.");
        return;
      }
      sendEvent({
        type: "session.start",
        payload: { title, prompt: currentPrompt, cwd: cwd.trim() || undefined, allowedTools: DEFAULT_ALLOWED_TOOLS, images: images?.length ? images : undefined }
      });
    } else {
      if (activeSession?.status === "running") {
        setGlobalError("Session is still running. Please wait for it to finish.");
        return;
      }
      sendEvent({ type: "session.continue", payload: { sessionId: activeSessionId, prompt: currentPrompt, images: images?.length ? images : undefined } });
    }
  }, [activeSession, activeSessionId, cwd, sendEvent, setGlobalError, setPendingStart]);

  const handleStop = useCallback(() => {
    if (!activeSessionId) return;
    sendEvent({ type: "session.stop", payload: { sessionId: activeSessionId } });
  }, [activeSessionId, sendEvent]);

  const handleStartFromModal = useCallback(() => {
    if (!cwd.trim()) {
      setGlobalError("Working Directory is required to start a session.");
      return;
    }
    const currentPrompt = useAppStore.getState().prompt;
    handleSend(currentPrompt);
  }, [cwd, handleSend, setGlobalError]);

  return { isRunning, handleSend, handleStop, handleStartFromModal };
}
