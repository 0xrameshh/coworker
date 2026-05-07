# Coworker UI Improvements Plan

## Overview
This plan outlines UI/UX improvements for the Coworker desktop app, focusing on theming, profiles, sidebar, and chat experience.

---

## Phase 1: Theme System Enhancement

### 1.1 Theme Preset Support
- [ ] Add theme presets to config schema (Dracula, Nord, Solarized, Monokai, etc.)
- [ ] Create theme definitions with full color palettes
- [ ] Add theme picker UI in SettingsModal
- [ ] Persist selected theme to config

### 1.2 Accent Color Picker
- [ ] Add visual accent color selector (not just CSS)
- [ ] Support custom hex color input
- [ ] Live preview of accent color changes

### 1.3 UI Density Controls
- [ ] Add compact/comfortable/spacious mode toggle
- [ ] Adjust message spacing, font sizes based on density
- [ ] Font size slider (12px - 18px range)

---

## Phase 2: Profile & Avatar System

### 2.1 User Profile Enhancement
- [ ] Add avatar support to userProfile in config
- [ ] Avatar options: initials, emoji picker, image upload
- [ ] Display user avatar in chat messages
- [ ] Display user avatar in sidebar header

### 2.2 AI Agent Configuration
- [ ] Add avatar/icon for AI assistant
- [ ] Preset AI avatars (robot, brain, sparkle, custom)
- [ ] AI personality presets (Professional, Casual, Technical, Creative)
- [ ] Custom system prompt field

### 2.3 Profile Display
- [ ] Show avatars in message bubbles
- [ ] Animated AI avatar during streaming
- [ ] Profile card on hover/click

---

## Phase 3: Sidebar Improvements

### 3.1 Session Organization
- [ ] Group sessions by date (Today, Yesterday, This Week, Older)
- [ ] Collapsible date groups
- [ ] Session count per group

### 3.2 Session Search
- [ ] Add search input at top of sidebar
- [ ] Filter sessions by title in real-time
- [ ] Highlight matching text

### 3.3 Session Actions
- [ ] Pin/unpin sessions (pinned stay at top)
- [ ] Session context menu (rename, delete, duplicate, export)
- [ ] Drag to reorder pinned sessions

### 3.4 Visual Enhancements
- [ ] Session preview text (first line of last message)
- [ ] Unread indicator for sessions with new content
- [ ] Session status icons (active, completed, error)

---

## Phase 4: Chat UI Enhancements

### 4.1 Message Interactions
- [ ] Copy message button (individual messages)
- [ ] Collapse/expand long tool outputs
- [ ] Message timestamp on hover

### 4.2 Input Improvements
- [ ] Prompt templates dropdown
- [ ] Recent prompts history (up arrow)
- [ ] Character/token count display

### 4.3 Visual Polish
- [ ] Smooth scroll to new messages
- [ ] Typing indicator animation
- [ ] Better loading states with skeleton UI

---

## Phase 5: Data & Export

### 5.1 Conversation Export
- [ ] Export session as Markdown
- [ ] Export session as JSON
- [ ] Export all sessions (backup)

### 5.2 Full-Text Search (Rust/SQLite)
- [ ] Add FTS5 virtual table for messages
- [ ] Global search across all conversations
- [ ] Search results with context preview

---

## Implementation Order

1. **Phase 1.1-1.2**: Theme presets + accent picker (foundation)
2. **Phase 2.1-2.2**: Avatar system (visual identity)
3. **Phase 3.1-3.2**: Sidebar grouping + search (organization)
4. **Phase 4.1**: Message interactions (polish)
5. **Phase 5.1**: Export functionality (utility)

---

## Technical Notes

### Files to Modify
- `src/ui/index.css` - Theme CSS variables
- `src/ui/components/SettingsModal.tsx` - Theme/profile UI
- `src/ui/components/CompactSidebar.tsx` - Sidebar improvements
- `src/ui/components/EventCard.tsx` - Message avatars
- `src/electron/libs/config-store.ts` - Config schema
- `src/ui/types.ts` - Type definitions

### New Files to Create
- `src/ui/themes/presets.ts` - Theme definitions
- `src/ui/components/ThemePicker.tsx` - Theme selection UI
- `src/ui/components/AvatarPicker.tsx` - Avatar selection UI
- `src/ui/components/Avatar.tsx` - Reusable avatar component

---

## Progress Tracking

| Phase | Status | Notes |
|-------|--------|-------|
| 1.1 Theme Presets | ✅ Complete | 8 presets: Coworker, Dracula, Nord, Solarized, Monokai, GitHub, Catppuccin, Tokyo Night |
| 1.2 Accent Picker | ✅ Complete | 8 colors with live preview |
| 1.3 UI Density | ⏳ Pending | Future enhancement |
| 2.1 User Avatar | ✅ Complete | Initials, emoji, image upload |
| 2.2 AI Config | ✅ Complete | Avatar + personality selection |
| 2.3 Profile Display | ✅ Complete | Avatars in chat messages |
| 3.1 Session Groups | ✅ Complete | Today, Yesterday, This Week, etc. |
| 3.2 Session Search | ✅ Complete | Real-time filtering |
| 3.3 Session Actions | ✅ Complete | Pin, delete with hover actions |
| 4.1 Message Actions | ✅ Complete | Copy button on messages |
| 5.1 Export | ⏳ Pending | Future enhancement |

## Files Created/Modified

### New Files
- `src/ui/themes/presets.ts` - Theme preset definitions and utilities
- `src/ui/components/Avatar.tsx` - Reusable avatar component with picker

### Modified Files
- `src/electron/libs/config-store.ts` - Added avatar and theme preset types
- `src/ui/store/useAppStore.ts` - Extended profile types with avatar
- `src/ui/components/SettingsModal.tsx` - Complete redesign with tabs
- `src/ui/components/CompactSidebar.tsx` - Wider sidebar with grouping, search, pins
- `src/ui/components/EventCard.tsx` - Added avatars to messages
- `src/ui/App.tsx` - Updated layout for wider sidebar
- `src/ui/components/PromptInput.tsx` - Updated layout for wider sidebar
