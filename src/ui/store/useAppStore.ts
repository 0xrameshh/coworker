import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { ServerEvent, SessionStatus, StreamMessage } from "../types";

export type PermissionRequest = {
  toolUseId: string;
  toolName: string;
  input: unknown;
};

export type AvatarData = {
  type: "initials" | "emoji";
  value: string;
};

export type Profile = {
  name: string;
  avatar?: AvatarData;
};

export type AiProfileData = Profile & {
  personality?: "professional" | "casual" | "technical" | "creative";
};

export type SessionView = {
  id: string;
  title: string;
  status: SessionStatus;
  cwd?: string;
  messages: StreamMessage[];
  permissionRequests: PermissionRequest[];
  lastPrompt?: string;
  createdAt?: number;
  updatedAt?: number;
  hydrated: boolean;
};

interface AppState {
  sessions: Record<string, SessionView>;
  activeSessionId: string | null;
  prompt: string;
  cwd: string;
  pendingStart: boolean;
  globalError: string | null;
  sessionsLoaded: boolean;
  showStartModal: boolean;
  showSettingsModal: boolean;
  historyRequested: Set<string>;
  userProfile: Profile;
  aiProfile: AiProfileData;
  activeModel: string;
  showDebugMessages: boolean;

  setPrompt: (prompt: string) => void;
  setCwd: (cwd: string) => void;
  setPendingStart: (pending: boolean) => void;
  setGlobalError: (error: string | null) => void;
  setShowStartModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;
  setActiveSessionId: (id: string | null) => void;
  markHistoryRequested: (sessionId: string) => void;
  resolvePermissionRequest: (sessionId: string, toolUseId: string) => void;
  handleServerEvent: (event: ServerEvent) => void;
  setUserProfile: (profile: Partial<Profile>) => void;
  setAiProfile: (profile: Partial<AiProfileData>) => void;
  setActiveModel: (model: string) => void;
  setShowDebugMessages: (show: boolean) => void;
}

function createSession(id: string): SessionView {
  return { id, title: "", status: "idle", messages: [], permissionRequests: [], hydrated: false };
}

export const useAppStore = create<AppState>((set, get) => ({
  sessions: {},
  activeSessionId: null,
  prompt: "",
  cwd: "",
  pendingStart: false,
  globalError: null,
  sessionsLoaded: false,
  showStartModal: false,
  showSettingsModal: false,
  historyRequested: new Set(),
  // Initialize with defaults - will be hydrated from Electron config on app load
  userProfile: { name: "You", avatar: { type: "initials" as const, value: "" } },
  aiProfile: { name: "Coworker", avatar: { type: "emoji" as const, value: "🤖" }, personality: "professional" as const },
  activeModel: "",
  showDebugMessages: false,

  setPrompt: (prompt) => set({ prompt }),
  setCwd: (cwd) => set({ cwd }),
  setPendingStart: (pendingStart) => set({ pendingStart }),
  setGlobalError: (globalError) => set({ globalError }),
  setShowStartModal: (showStartModal) => set({ showStartModal }),
  setShowSettingsModal: (showSettingsModal) => set({ showSettingsModal }),
  setActiveSessionId: (id) => set({ activeSessionId: id }),

  markHistoryRequested: (sessionId) => {
    set((state) => {
      const next = new Set(state.historyRequested);
      next.add(sessionId);
      return { historyRequested: next };
    });
  },

  resolvePermissionRequest: (sessionId, toolUseId) => {
    set((state) => {
      const existing = state.sessions[sessionId];
      if (!existing) return {};
      return {
        sessions: {
          ...state.sessions,
          [sessionId]: {
            ...existing,
            permissionRequests: existing.permissionRequests.filter(req => req.toolUseId !== toolUseId)
          }
        }
      };
    });
  },

  handleServerEvent: (event) => {
    const state = get();

    switch (event.type) {
      case "session.list": {
        const nextSessions: Record<string, SessionView> = {};
        for (const session of event.payload.sessions) {
          const existing = state.sessions[session.id] ?? createSession(session.id);
          nextSessions[session.id] = {
            ...existing,
            status: session.status,
            title: session.title,
            cwd: session.cwd,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
          };
        }

        set({ sessions: nextSessions, sessionsLoaded: true });

        const hasSessions = event.payload.sessions.length > 0;
        set({ showStartModal: !hasSessions });

        if (!hasSessions) {
          get().setActiveSessionId(null);
        }

        if (!state.activeSessionId && event.payload.sessions.length > 0) {
          const sorted = [...event.payload.sessions].sort((a, b) => {
            const aTime = a.updatedAt ?? a.createdAt ?? 0;
            const bTime = b.updatedAt ?? b.createdAt ?? 0;
            return aTime - bTime;
          });
          const latestSession = sorted[sorted.length - 1];
          if (latestSession) {
            get().setActiveSessionId(latestSession.id);
          }
        } else if (state.activeSessionId) {
          const stillExists = event.payload.sessions.some(
            (session) => session.id === state.activeSessionId
          );
          if (!stillExists) {
            get().setActiveSessionId(null);
          }
        }
        break;
      }

      case "session.history": {
        const { sessionId, messages, status } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...existing, status, messages, hydrated: true }
            }
          };
        });
        break;
      }

      case "session.status": {
        const { sessionId, status, title, cwd, error } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...existing,
                status,
                title: title ?? existing.title,
                cwd: cwd ?? existing.cwd,
                updatedAt: Date.now()
              }
            }
          };
        });

        if (state.pendingStart) {
          get().setActiveSessionId(sessionId);
          set({ pendingStart: false, showStartModal: false });

          // Show error to user if session failed to start
          if (status === "error" && error) {
            set({ globalError: `Session failed: ${error}` });
          }
        }
        break;
      }

      case "session.deleted": {
        const { sessionId } = event.payload;
        const state = get();
        if (!state.sessions[sessionId]) break;
        const nextSessions = { ...state.sessions };
        delete nextSessions[sessionId];
        set({
          sessions: nextSessions,
          showStartModal: Object.keys(nextSessions).length === 0
        });
        if (state.activeSessionId === sessionId) {
          const remaining = Object.values(nextSessions).sort(
            (a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0)
          );
          get().setActiveSessionId(remaining[0]?.id ?? null);
        }
        break;
      }

      case "stream.message": {
        const { sessionId, message } = event.payload;

        // Skip stream_event messages - they're raw deltas we don't need
        // since includePartialMessages gives us full accumulated messages
        if ('type' in message && message.type === 'stream_event') {
          break;
        }

        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          const messages = [...existing.messages];

          // Helper to get message ID for deduplication
          const getMessageId = (msg: any) => msg?.message?.id;
          const newMessageId = getMessageId(message);
          const newMessageType = 'type' in message ? message.type : null;

          // Find if we already have a message with the same ID (for partial updates)
          // This handles streaming updates where the same message ID is sent with more content
          const existingIndex = newMessageId
            ? messages.findIndex((m: any) => getMessageId(m) === newMessageId)
            : -1;

          if (existingIndex >= 0) {
            // Update existing message in place (partial update)
            messages[existingIndex] = message;
          } else if (newMessageType === 'user') {
            // Check if the last message is user_prompt - replace it with SDK's user message
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && 'type' in lastMessage && lastMessage.type === 'user_prompt') {
              messages[messages.length - 1] = message;
            } else {
              messages.push(message);
            }
          } else {
            // Append new message
            messages.push(message);
          }

          return {
            sessions: {
              ...state.sessions,
              [sessionId]: { ...existing, messages }
            }
          };
        });
        break;
      }

      case "stream.user_prompt": {
        const { sessionId, prompt } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...existing,
                messages: [...existing.messages, { type: "user_prompt", prompt }]
              }
            }
          };
        });
        break;
      }

      case "permission.request": {
        const { sessionId, toolUseId, toolName, input } = event.payload;
        set((state) => {
          const existing = state.sessions[sessionId] ?? createSession(sessionId);
          return {
            sessions: {
              ...state.sessions,
              [sessionId]: {
                ...existing,
                permissionRequests: [...existing.permissionRequests, { toolUseId, toolName, input }]
              }
            }
          };
        });
        break;
      }

      case "runner.error": {
        set({ globalError: event.payload.message });
        break;
      }
    }
  },

  setUserProfile: (profile) => {
    set((state) => {
      const next = { ...state.userProfile, ...profile };
      return { userProfile: next };
    });
  },

  setAiProfile: (profile) => {
    set((state) => {
      const next = { ...state.aiProfile, ...profile };
      return { aiProfile: next };
    });
  },

  setActiveModel: (activeModel) => set({ activeModel }),

  setShowDebugMessages: (showDebugMessages) => set({ showDebugMessages })
}));

// Export useShallow for components that need to select multiple state values
export { useShallow };
