import {
  themePresets,
  accentColors,
  getEffectiveMode,
} from "../../themes/presets";
import type { Theme, AppConfig } from "./types";

interface AppearanceTabProps {
  selectedTheme: Theme;
  selectedPreset: string;
  selectedAccent: string;
  customAccentColor: string;
  nightMode: boolean;
  showDebugMessages: boolean;
  config: AppConfig | null;
  onThemeChange: (theme: Theme) => void;
  onPresetChange: (presetId: string) => void;
  onAccentChange: (accentId: string) => void;
  onCustomAccentChange: (color: string) => void;
  setCustomAccentColor: (color: string) => void;
  onNightModeChange: (enabled: boolean) => void;
  onDebugMessagesChange: (enabled: boolean) => void;
}

export function AppearanceTab({
  selectedTheme,
  selectedPreset,
  selectedAccent,
  customAccentColor,
  nightMode,
  showDebugMessages,
  onThemeChange,
  onPresetChange,
  onAccentChange,
  onCustomAccentChange,
  setCustomAccentColor,
  onNightModeChange,
  onDebugMessagesChange,
}: AppearanceTabProps) {
  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <div>
        <label className="text-xs font-medium text-muted uppercase tracking-wider">Mode</label>
        <div className="flex gap-2 mt-2">
          {(["light", "dark", "system"] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                selectedTheme === t
                  ? "border-accent-500 bg-accent-500/10 text-ink-800 shadow-sm"
                  : "border-ink-900/10 bg-surface text-ink-700 hover:bg-surface-tertiary"
              }`}
              onClick={() => onThemeChange(t)}
            >
              <div className="flex items-center justify-center gap-2">
                {t === "light" && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                )}
                {t === "dark" && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                {t === "system" && (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                )}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Night Mode */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Night Mode</label>
            <p className="text-xs text-muted mt-1">Reduces brightness and applies warm filter for comfortable nighttime viewing</p>
          </div>
          <button
            type="button"
            onClick={() => onNightModeChange(!nightMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              nightMode ? "bg-accent-500" : "bg-ink-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                nightMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Debug Messages */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">Show Debug Messages</label>
            <p className="text-xs text-muted mt-1">Display system messages, session results, and empty content blocks for debugging</p>
          </div>
          <button
            type="button"
            onClick={() => onDebugMessagesChange(!showDebugMessages)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showDebugMessages ? "bg-accent-500" : "bg-ink-400"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showDebugMessages ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Theme Presets */}
      <div>
        <label className="text-xs font-medium text-muted uppercase tracking-wider">Theme</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {themePresets.map((preset) => {
            const colors = preset.colors[getEffectiveMode(selectedTheme)];
            return (
              <button
                key={preset.id}
                type="button"
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedPreset === preset.id
                    ? "border-accent-500 bg-accent-500/5 shadow-sm"
                    : "border-ink-900/10 hover:bg-surface-tertiary"
                }`}
                onClick={() => onPresetChange(preset.id)}
              >
                {/* Color preview */}
                <div className="flex -space-x-1">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: colors.surface }}
                  />
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: colors.surfaceSecondary }}
                  />
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: colors.accent }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-800 truncate">{preset.name}</div>
                  <div className="text-xs text-muted truncate">{preset.description}</div>
                </div>
                {selectedPreset === preset.id && (
                  <svg className="w-4 h-4 text-accent-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div>
        <label className="text-xs font-medium text-muted uppercase tracking-wider">Accent Color</label>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          {accentColors.map((accent) => (
            <button
              key={accent.id}
              type="button"
              className={`w-10 h-10 rounded-xl transition-all hover:scale-110 ${
                selectedAccent === accent.id
                  ? "ring-2 ring-offset-2 ring-offset-surface"
                  : ""
              }`}
              style={{
                backgroundColor: accent.color,
                boxShadow: selectedAccent === accent.id ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${accent.color}` : "none",
              }}
              onClick={() => onAccentChange(accent.id)}
              title={accent.name}
            />
          ))}
          {/* Custom Color Picker */}
          <div className="relative">
            <input
              type="color"
              value={customAccentColor}
              onChange={(e) => onCustomAccentChange(e.target.value)}
              className="absolute inset-0 w-10 h-10 opacity-0 cursor-pointer"
              title="Custom color"
            />
            <div
              className={`w-10 h-10 rounded-xl transition-all hover:scale-110 flex items-center justify-center border-2 border-dashed ${
                selectedAccent === "custom"
                  ? "border-transparent"
                  : "border-ink-400"
              }`}
              style={{
                backgroundColor: selectedAccent === "custom" ? customAccentColor : "transparent",
                boxShadow: selectedAccent === "custom" ? `0 0 0 2px var(--color-surface), 0 0 0 4px ${customAccentColor}` : "none",
              }}
            >
              {selectedAccent !== "custom" && (
                <svg className="w-5 h-5 text-ink-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              )}
            </div>
          </div>
        </div>
        {selectedAccent === "custom" && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted">Custom:</span>
            <input
              type="text"
              value={customAccentColor}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  setCustomAccentColor(value);
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    onCustomAccentChange(value);
                  }
                }
              }}
              className="w-24 px-2 py-1 text-xs rounded-lg border border-ink-900/10 bg-surface text-ink-800 font-mono focus:border-accent-500 focus:outline-none"
              placeholder="#E36440"
            />
          </div>
        )}
      </div>
    </div>
  );
}
