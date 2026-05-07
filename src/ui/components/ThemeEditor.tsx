import { useState, useEffect } from "react";
import { ThemeColors, themePresets, getEffectiveMode } from "../themes/presets";

interface ThemeEditorProps {
  initialColors?: Partial<ThemeColors>;
  mode: "light" | "dark" | "system";
  onColorsChange: (colors: ThemeColors) => void;
  onSaveAsPreset?: (name: string, colors: ThemeColors) => void;
}

type ColorCategory = "surfaces" | "text" | "accent";

const colorLabels: Record<keyof ThemeColors, { label: string; description: string; category: ColorCategory }> = {
  surface: { label: "Background", description: "Main app background", category: "surfaces" },
  surfaceSecondary: { label: "Secondary", description: "Cards, sidebars", category: "surfaces" },
  surfaceTertiary: { label: "Tertiary", description: "Hover states, borders", category: "surfaces" },
  ink900: { label: "Primary Text", description: "Headings, important text", category: "text" },
  ink800: { label: "Secondary Text", description: "Body text", category: "text" },
  ink700: { label: "Tertiary Text", description: "Subtext", category: "text" },
  ink600: { label: "Muted Text", description: "Less important text", category: "text" },
  ink500: { label: "Subtle Text", description: "Placeholders", category: "text" },
  ink400: { label: "Faint Text", description: "Disabled text", category: "text" },
  accent: { label: "Accent", description: "Buttons, links, highlights", category: "accent" },
  accentHover: { label: "Accent Hover", description: "Hover state for accent", category: "accent" },
};

const defaultColors: ThemeColors = {
  surface: "#0a0a0a",
  surfaceSecondary: "#121212",
  surfaceTertiary: "#1a1a1a",
  ink900: "#f4f4f5",
  ink800: "#e4e4e7",
  ink700: "#d4d4d8",
  ink600: "#a1a1aa",
  ink500: "#71717a",
  ink400: "#52525b",
  accent: "#E36440",
  accentHover: "#D15635",
};

export function ThemeEditor({ initialColors, mode, onColorsChange, onSaveAsPreset }: ThemeEditorProps) {
  const effectiveMode = getEffectiveMode(mode);
  const [colors, setColors] = useState<ThemeColors>(() => {
    if (initialColors && Object.keys(initialColors).length > 0) {
      return { ...defaultColors, ...initialColors };
    }
    // Start with the default theme colors for the current mode
    return { ...themePresets[0].colors[effectiveMode] };
  });
  const [presetName, setPresetName] = useState("");
  const [activeCategory, setActiveCategory] = useState<ColorCategory>("surfaces");

  // Apply colors in real-time
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--color-surface", colors.surface);
    root.style.setProperty("--color-surface-secondary", colors.surfaceSecondary);
    root.style.setProperty("--color-surface-tertiary", colors.surfaceTertiary);
    root.style.setProperty("--color-ink-900", colors.ink900);
    root.style.setProperty("--color-ink-800", colors.ink800);
    root.style.setProperty("--color-ink-700", colors.ink700);
    root.style.setProperty("--color-ink-600", colors.ink600);
    root.style.setProperty("--color-ink-500", colors.ink500);
    root.style.setProperty("--color-ink-400", colors.ink400);
    root.style.setProperty("--color-accent-500", colors.accent);
    root.style.setProperty("--color-accent-600", colors.accentHover);
  }, [colors]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    onColorsChange(newColors);
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (preset) {
      const presetColors = preset.colors[effectiveMode];
      setColors(presetColors);
      onColorsChange(presetColors);
    }
  };

  const categories: { id: ColorCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: "surfaces",
      label: "Surfaces",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
        </svg>
      ),
    },
    {
      id: "text",
      label: "Text",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7V4h16v3M9 20h6M12 4v16" />
        </svg>
      ),
    },
    {
      id: "accent",
      label: "Accent",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    },
  ];

  const colorsByCategory = Object.entries(colorLabels).filter(
    ([_, meta]) => meta.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Quick Preset Selector */}
      <div>
        <label className="text-xs font-medium text-muted uppercase tracking-wider mb-2 block">
          Start from preset
        </label>
        <div className="flex gap-2 flex-wrap">
          {themePresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className="px-3 py-1.5 text-xs rounded-lg border border-ink-900/10 hover:bg-surface-tertiary transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              activeCategory === cat.id
                ? "bg-surface text-ink-800 shadow-sm"
                : "text-muted hover:text-ink-700"
            }`}
          >
            {cat.icon}
            {cat.label}
          </button>
        ))}
      </div>

      {/* Color Editors */}
      <div className="space-y-3">
        {colorsByCategory.map(([key, meta]) => (
          <div
            key={key}
            className="flex items-center gap-4 p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5"
          >
            {/* Color Preview + Picker */}
            <div className="relative">
              <input
                type="color"
                value={colors[key as keyof ThemeColors]}
                onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                className="absolute inset-0 w-12 h-12 opacity-0 cursor-pointer"
              />
              <div
                className="w-12 h-12 rounded-xl border-2 border-ink-900/10 shadow-inner"
                style={{ backgroundColor: colors[key as keyof ThemeColors] }}
              />
            </div>

            {/* Label + Description */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-ink-800">{meta.label}</div>
              <div className="text-xs text-muted truncate">{meta.description}</div>
            </div>

            {/* Hex Input */}
            <input
              type="text"
              value={colors[key as keyof ThemeColors]}
              onChange={(e) => {
                const value = e.target.value;
                if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) {
                  handleColorChange(key as keyof ThemeColors, value);
                }
              }}
              className="w-24 px-2 py-1.5 text-xs font-mono rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
              placeholder="#000000"
            />
          </div>
        ))}
      </div>

      {/* Preview Section */}
      <div className="p-4 rounded-xl border border-ink-900/10" style={{ backgroundColor: colors.surface }}>
        <div className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: colors.ink600 }}>
          Live Preview
        </div>
        <div className="space-y-3">
          <div className="text-lg font-semibold" style={{ color: colors.ink900 }}>
            Primary Heading
          </div>
          <div className="text-sm" style={{ color: colors.ink800 }}>
            This is body text that would appear in messages.
          </div>
          <div className="text-xs" style={{ color: colors.ink600 }}>
            Muted helper text for context.
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: colors.accent }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = colors.accentHover)}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = colors.accent)}
            >
              Primary Button
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.ink400,
                color: colors.ink800,
              }}
            >
              Secondary
            </button>
          </div>
          <div
            className="mt-4 p-3 rounded-lg"
            style={{ backgroundColor: colors.surfaceTertiary }}
          >
            <div className="text-xs font-mono" style={{ color: colors.ink700 }}>
              Code block or tertiary surface
            </div>
          </div>
        </div>
      </div>

      {/* Save as Preset */}
      {onSaveAsPreset && (
        <div className="flex gap-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="My Custom Theme"
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (presetName.trim()) {
                onSaveAsPreset(presetName.trim(), colors);
                setPresetName("");
              }
            }}
            disabled={!presetName.trim()}
            className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
          >
            Save Theme
          </button>
        </div>
      )}
    </div>
  );
}
