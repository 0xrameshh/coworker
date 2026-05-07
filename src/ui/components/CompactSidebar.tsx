import { useState, useMemo } from "react";
import { useAppStore, type SessionView } from "../store/useAppStore";

interface CompactSidebarProps {
  connected: boolean;
  onNewSession: () => void;
  onOpenSettings: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

type DateGroup = "pinned" | "today" | "yesterday" | "thisWeek" | "thisMonth" | "older";

const dateGroupLabels: Record<DateGroup, string> = {
  pinned: "Pinned",
  today: "Today",
  yesterday: "Yesterday",
  thisWeek: "This Week",
  thisMonth: "This Month",
  older: "Older",
};

function getDateGroup(timestamp: number | undefined, isPinned: boolean): DateGroup {
  if (isPinned) return "pinned";
  if (!timestamp) return "older";

  const now = new Date();
  const date = new Date(timestamp);

  // Reset time to compare dates only
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  if (date >= today) return "today";
  if (date >= yesterday) return "yesterday";
  if (date >= weekAgo) return "thisWeek";
  if (date >= monthAgo) return "thisMonth";
  return "older";
}

// Get pinned sessions from localStorage
function getPinnedSessions(): Set<string> {
  try {
    const stored = localStorage.getItem("pinnedSessions");
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

// Save pinned sessions to localStorage
function savePinnedSessions(pinned: Set<string>): void {
  localStorage.setItem("pinnedSessions", JSON.stringify([...pinned]));
}

export function CompactSidebar({
  connected,
  onNewSession,
  onOpenSettings,
}: CompactSidebarProps) {
  const sessions = useAppStore((state) => state.sessions);
  const activeSessionId = useAppStore((state) => state.activeSessionId);
  const aiProfile = useAppStore((state) => state.aiProfile);

  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedSessions, setPinnedSessions] = useState<Set<string>>(getPinnedSessions);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<DateGroup>>(new Set());
  const [showSearch, setShowSearch] = useState(false);

  // Toggle pin status
  const togglePin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newPinned = new Set(pinnedSessions);
    if (newPinned.has(sessionId)) {
      newPinned.delete(sessionId);
    } else {
      newPinned.add(sessionId);
    }
    setPinnedSessions(newPinned);
    savePinnedSessions(newPinned);
  };

  // Toggle group collapse
  const toggleGroup = (group: DateGroup) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(group)) {
      newCollapsed.delete(group);
    } else {
      newCollapsed.add(group);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Filter and group sessions
  const groupedSessions = useMemo(() => {
    const allSessions = Object.values(sessions);

    // Filter by search
    const filtered = searchQuery
      ? allSessions.filter((s) =>
          s.title?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : allSessions;

    // Sort by updatedAt descending
    const sorted = filtered.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    // Group by date
    const groups: Record<DateGroup, SessionView[]> = {
      pinned: [],
      today: [],
      yesterday: [],
      thisWeek: [],
      thisMonth: [],
      older: [],
    };

    sorted.forEach((session) => {
      const isPinned = pinnedSessions.has(session.id);
      const group = getDateGroup(session.updatedAt, isPinned);
      groups[group].push(session);
    });

    return groups;
  }, [sessions, searchQuery, pinnedSessions]);

  // Order of groups to display
  const groupOrder: DateGroup[] = ["pinned", "today", "yesterday", "thisWeek", "thisMonth", "older"];

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this session?")) {
      await window.electron.sendClientEvent({ type: "session.delete", payload: { sessionId } });
    }
  };

  const handleExportSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const session = sessions[sessionId];
    if (!session) return;

    // Format messages for export
    const exportData = {
      sessionId: session.id,
      title: session.title,
      status: session.status,
      cwd: session.cwd,
      createdAt: session.createdAt ? new Date(session.createdAt).toISOString() : null,
      updatedAt: session.updatedAt ? new Date(session.updatedAt).toISOString() : null,
      messages: session.messages.map((msg: any) => {
        if (msg.type === 'user_prompt') {
          return { type: 'user', content: msg.prompt };
        }
        if (msg.type === 'assistant' || msg.type === 'user') {
          return {
            type: msg.type,
            messageId: msg.message?.id,
            content: msg.message?.content
          };
        }
        if (msg.type === 'system' || msg.type === 'result') {
          return msg;
        }
        return msg;
      })
    };

    // Create blob and download
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${session.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col border-r border-ink-900/10 bg-surface/95 backdrop-blur-xl z-50">
      {/* Drag region for macOS traffic lights - needs ~52px clearance */}
      <div
        className="h-14 flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      />
      {/* Header */}
      <div className="px-4 pb-3 border-b border-ink-900/10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-9 h-9 rounded-xl bg-[#0F0F1A] flex items-center justify-center flex-shrink-0">
            <svg className="h-4.5 w-4.5" viewBox="0 0 512 512" fill="none">
              <path d="M360 160C330 130 290 120 245 120C165 120 105 180 105 256C105 332 165 392 245 392C290 392 330 382 360 352"
                stroke="#F5A623" strokeWidth="56" strokeLinecap="round" />
              <rect x="250" y="232" width="130" height="48" rx="24" fill="#F5A623" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-ink-800 truncate">
              {aiProfile.name || "Coworker"}
            </div>
            <div className="text-xs text-muted">
              {connected ? "Connected" : "Disconnected"}
            </div>
          </div>
          {/* New Session Button */}
          <button
            className="w-8 h-8 rounded-lg bg-accent-500 hover:bg-accent-600 flex items-center justify-center text-white shadow-sm transition-all hover:shadow-md active:scale-[0.95] group"
            onClick={onNewSession}
            title="New Session (Cmd+N)"
          >
            <svg className="h-4 w-4 transition-transform group-hover:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        {/* Search toggle/input */}
        <div className="mt-3">
          {showSearch ? (
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search sessions..."
                className="w-full pl-8 pr-8 py-1.5 text-sm bg-surface-secondary rounded-lg border border-ink-900/10 focus:border-accent-500 focus:outline-none text-ink-800 placeholder:text-muted"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink-700"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearch(false);
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ) : (
            <button
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm text-muted hover:text-ink-700 hover:bg-surface-secondary rounded-lg transition-colors"
              onClick={() => setShowSearch(true)}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search sessions...
            </button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {Object.values(sessions).length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-sm text-ink-700 font-medium">No sessions yet</p>
            <p className="text-xs text-muted mt-1">Start a new conversation</p>
          </div>
        ) : (
          groupOrder.map((group) => {
            const groupSessions = groupedSessions[group];
            if (groupSessions.length === 0) return null;

            const isCollapsed = collapsedGroups.has(group);

            return (
              <div key={group} className="mb-2">
                {/* Group header */}
                <button
                  className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-medium text-muted uppercase tracking-wider hover:text-ink-600 transition-colors"
                  onClick={() => toggleGroup(group)}
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                  {dateGroupLabels[group]}
                  <span className="text-muted-light ml-auto">{groupSessions.length}</span>
                </button>

                {/* Sessions in group */}
                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {groupSessions.map((session) => {
                      const isPinned = pinnedSessions.has(session.id);
                      const isActive = activeSessionId === session.id;

                      return (
                        <div
                          key={session.id}
                          className={`group relative rounded-lg transition-all ${
                            isActive
                              ? "bg-accent-500/10"
                              : "hover:bg-surface-secondary"
                          }`}
                        >
                          <button
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left"
                            onClick={() => useAppStore.getState().setActiveSessionId(session.id)}
                          >
                            {/* Session icon or first letter */}
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                                isActive
                                  ? "bg-accent-500 text-white"
                                  : "bg-surface-tertiary text-ink-600"
                              }`}
                            >
                              {session.title?.charAt(0).toUpperCase() || "?"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className={`text-sm truncate ${isActive ? "text-ink-800 font-medium" : "text-ink-700"}`}>
                                {session.title || "Untitled"}
                              </div>
                              <div className="text-xs text-muted truncate">
                                {session.cwd?.replace(/^\/Users\/[^/]+/, "~") || "No directory"}
                              </div>
                            </div>

                            {/* Status indicator */}
                            {session.status === "running" && (
                              <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                            )}
                          </button>

                          {/* Action buttons (show on hover) */}
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Pin button */}
                            <button
                              className={`p-1 rounded hover:bg-surface-tertiary transition-colors ${
                                isPinned ? "text-accent-500" : "text-muted hover:text-ink-700"
                              }`}
                              onClick={(e) => togglePin(session.id, e)}
                              title={isPinned ? "Unpin" : "Pin"}
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill={isPinned ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </button>

                            {/* Export button */}
                            <button
                              className="p-1 rounded text-muted hover:text-accent-500 hover:bg-accent-500/10 transition-colors"
                              onClick={(e) => handleExportSession(session.id, e)}
                              title="Export chat log"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                              </svg>
                            </button>

                            {/* Delete button */}
                            <button
                              className="p-1 rounded text-muted hover:text-error hover:bg-error/10 transition-colors"
                              onClick={(e) => handleDeleteSession(session.id, e)}
                              title="Delete"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-3 py-3 border-t border-ink-900/10">
        <button
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-ink-600 hover:text-ink-800 hover:bg-surface-secondary transition-colors"
          onClick={onOpenSettings}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span className="text-sm">Settings</span>
          <span className="ml-auto text-xs text-muted">Cmd+,</span>
        </button>

        {/* Connection status */}
        <div className="flex items-center gap-2 px-2.5 py-2 mt-1">
          <div
            className={`w-2 h-2 rounded-full ${connected ? "bg-success" : "bg-error"}`}
          />
          <span className="text-xs text-muted">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>
    </aside>
  );
}
