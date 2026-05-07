import { useCallback, useEffect, useRef, useState } from "react";
import type { PermissionResult } from "@anthropic-ai/claude-agent-sdk";
import { useIPC } from "./hooks/useIPC";
import { useTheme } from "./hooks/useTheme";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useAppStore, useShallow } from "./store/useAppStore";
import type { ServerEvent } from "./types";
import { CompactSidebar } from "./components/CompactSidebar";
import { StartSessionModal } from "./components/StartSessionModal";
import { SettingsModal } from "./components/SettingsModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { PromptInput } from "./components/PromptInput";
import { usePromptActions } from "./hooks/usePromptActions";
import { MessageCard } from "./components/EventCard";
import { ToastContainer } from "./components/Toast";
import { CommandPalette, useCommandPalette } from "./components/CommandPalette";
import { LoadingIndicator } from "./components/Loading";

function App() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Initialize theme on app load
  useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Command palette
  const { isOpen: isCommandPaletteOpen, open: openCommandPalette, close: closeCommandPalette } = useCommandPalette();

  // Check if onboarding is needed and load profiles from config
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron) {
      // Check onboarding status
      window.electron.hasCompletedOnboarding().then((completed: boolean) => {
        if (!completed) {
          setShowOnboarding(true);
        }
      });

      // Load profiles from Electron config and sync to store
      window.electron.getFullConfig().then((config: any) => {
        if (config?.userProfile) {
          useAppStore.getState().setUserProfile(config.userProfile);
        }
        if (config?.aiProfile) {
          useAppStore.getState().setAiProfile(config.aiProfile);
        }
      }).catch((err: any) => {
        console.error("Failed to load config:", err);
      });

      // Load active model and debug settings from app config
      window.electron.getAppConfig().then((config: any) => {
        if (config?.providers && config.activeProvider) {
          const active = config.providers.find((p: any) => p.id === config.activeProvider);
          if (active?.model) {
            useAppStore.getState().setActiveModel(active.model);
          }
        }
        // Load showDebugMessages setting
        if (config?.showDebugMessages !== undefined) {
          useAppStore.getState().setShowDebugMessages(config.showDebugMessages);
        }
      }).catch((err: any) => {
        console.error("Failed to load app config:", err);
      });
    }
  }, []);

  // Split selectors to minimize re-renders
  // Actions never change - select once
  const actions = useAppStore(useShallow((s) => ({
    setShowStartModal: s.setShowStartModal,
    setShowSettingsModal: s.setShowSettingsModal,
    setGlobalError: s.setGlobalError,
    markHistoryRequested: s.markHistoryRequested,
    resolvePermissionRequest: s.resolvePermissionRequest,
    handleServerEvent: s.handleServerEvent,
    setPrompt: s.setPrompt,
    setCwd: s.setCwd
  })));

  // UI state - changes infrequently
  const uiState = useAppStore(useShallow((s) => ({
    showStartModal: s.showStartModal,
    showSettingsModal: s.showSettingsModal,
    globalError: s.globalError,
    prompt: s.prompt,
    cwd: s.cwd,
    pendingStart: s.pendingStart
  })));

  // Active session data - only re-render when THIS session changes
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const activeSession = useAppStore((s) =>
    s.activeSessionId ? s.sessions[s.activeSessionId] : undefined
  );
  const historyRequested = useAppStore((s) => s.historyRequested);

  const {
    setShowStartModal,
    setShowSettingsModal,
    setGlobalError,
    markHistoryRequested,
    resolvePermissionRequest,
    handleServerEvent,
    setPrompt,
    setCwd
  } = actions;

  const {
    showStartModal,
    showSettingsModal,
    globalError,
    prompt,
    cwd,
    pendingStart
  } = uiState;

  // Event handler - just forward to store
  const onEvent = useCallback((event: ServerEvent) => {
    handleServerEvent(event);
  }, [handleServerEvent]);

  const { connected, sendEvent } = useIPC(onEvent);
  const { handleStartFromModal } = usePromptActions(sendEvent);

  const messages = activeSession?.messages ?? [];
  const permissionRequests = activeSession?.permissionRequests ?? [];
  const isRunning = activeSession?.status === "running";

  useEffect(() => {
    if (connected) sendEvent({ type: "session.list" });
  }, [connected, sendEvent]);

  useEffect(() => {
    if (!activeSessionId || !connected || !activeSession) return;
    if (!activeSession.hydrated && !historyRequested.has(activeSessionId)) {
      markHistoryRequested(activeSessionId);
      sendEvent({ type: "session.history", payload: { sessionId: activeSessionId } });
    }
  }, [activeSessionId, connected, activeSession, historyRequested, markHistoryRequested, sendEvent]);

  // Auto-scroll when new messages arrive or session is loaded
  // Use requestAnimationFrame to wait for DOM to render
  useEffect(() => {
    // Wait for next frame to ensure DOM is updated
    requestAnimationFrame(() => {
      // Use another rAF to be extra safe (after paint)
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      });
    });
  }, [messages, activeSession?.hydrated]);

  const handleNewSession = useCallback(() => {
    useAppStore.getState().setActiveSessionId(null);
    setShowStartModal(true);
  }, [setShowStartModal]);

  const handlePermissionResult = useCallback((toolUseId: string, result: PermissionResult) => {
    if (!activeSessionId) return;
    sendEvent({ type: "permission.response", payload: { sessionId: activeSessionId, toolUseId, result } });
    resolvePermissionRequest(activeSessionId, toolUseId);
  }, [activeSessionId, sendEvent, resolvePermissionRequest]);

  // Keyboard shortcuts (after handleNewSession is defined)
  useKeyboardShortcuts({
    "toggle-command-palette": openCommandPalette,
    "toggle-sidebar": () => setSidebarOpen(prev => !prev),
    "new-session": handleNewSession,
    "open-settings": () => setShowSettingsModal(true),
    "go-to-chat": () => {
      const input = document.querySelector('textarea[placeholder*="Describe"]') as HTMLTextAreaElement;
      input?.focus();
    },
  }, !showOnboarding && !showStartModal && !showSettingsModal);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Compact Sidebar */}
      <CompactSidebar
        connected={connected}
        onNewSession={handleNewSession}
        onOpenSettings={() => setShowSettingsModal(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-cream pt-12 lg:pt-0 h-screen lg:ml-64">
        {/* Header bar with drag region */}
        <header
          className="flex items-center justify-between h-14 px-4 border-b border-ink-900/10 bg-surface-cream select-none shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          {/* Left section */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-surface-secondary transition-colors"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-sm font-medium text-ink-700 truncate max-w-xs lg:max-w-md">
              {activeSession?.title || "Coworker"}
            </h1>
          </div>

          {/* Right section - Settings */}
          <button
            className="p-2 rounded-lg text-ink-500 hover:text-ink-700 hover:bg-surface-secondary transition-colors"
            title="Settings"
            onClick={() => setShowSettingsModal(true)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </header>

        {/* Messages area - simple scrollable list */}
        <div className="flex-1 overflow-y-auto scroll-smooth px-4 pb-48 pt-6 sm:px-6 lg:px-8 bg-surface-cream dark:bg-surface">
          <div className="mx-auto max-w-4xl xl:max-w-5xl">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-[#0F0F1A] flex items-center justify-center mb-6 shadow-xl border border-white/5">
                  <svg className="h-10 w-10" viewBox="0 0 512 512" fill="none">
                    <path d="M360 160C330 130 290 120 245 120C165 120 105 180 105 256C105 332 165 392 245 392C290 392 330 382 360 352"
                      stroke="#F5A623" strokeWidth="56" strokeLinecap="round" />
                    <rect x="250" y="232" width="130" height="48" rx="24" fill="#F5A623" />
                  </svg>
                </div>
                <div className="text-xl font-semibold text-ink-800 mb-2">Welcome to Coworker</div>
                <p className="text-sm text-muted max-w-md mb-8 leading-relaxed">
                  Start a new session to collaborate with Coworker. Describe your task, and we'll get started building something amazing together.
                </p>
                <button
                  onClick={handleNewSession}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-600 text-white text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Start New Session
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {messages.map((msg, idx) => (
                    <MessageCard
                      key={idx}
                      message={msg}
                      isLast={idx === messages.length - 1}
                      isRunning={isRunning}
                      permissionRequest={permissionRequests[0]}
                      onPermissionResult={handlePermissionResult}
                    />
                  ))}
                </div>

                {/* Loading indicator */}
                {isRunning && (() => {
                  const lastMsg = messages[messages.length - 1];
                  if (lastMsg.type === 'user_prompt' || lastMsg.type === 'user' || lastMsg.type === 'system') {
                    return <LoadingIndicator />;
                  }
                  if (lastMsg.type === 'assistant' && 'message' in lastMsg) {
                    const content = (lastMsg as any).message?.content;
                    const hasVisibleContent = content?.some((c: any) =>
                      (c.type === 'text' && c.text?.length > 0) ||
                      (c.type === 'thinking' && c.thinking?.length > 0)
                    );
                    if (!hasVisibleContent) return <LoadingIndicator />;
                  }
                  return null;
                })()}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Prompt input */}
        <PromptInput sendEvent={sendEvent} />
      </main>

      {/* Modals */}
      {showStartModal && (
        <StartSessionModal
          cwd={cwd}
          prompt={prompt}
          pendingStart={pendingStart}
          onCwdChange={setCwd}
          onPromptChange={setPrompt}
          onStart={handleStartFromModal}
          onClose={() => setShowStartModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            setShowOnboarding(false);
          }}
        />
      )}

      {/* Command Palette */}
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={closeCommandPalette} />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Global error toast (deprecated, use Toast instead) */}
      {globalError && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-error/20 bg-error-light px-4 py-3 shadow-lg animate-scale-in">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-error font-medium">{globalError}</span>
            <button
              className="p-1 rounded hover:bg-error/10 transition-colors"
              onClick={() => setGlobalError(null)}
            >
              <svg className="h-4 w-4 text-error" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
