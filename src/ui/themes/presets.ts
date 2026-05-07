// Theme preset definitions for Coworker
// Each theme defines colors for both light and dark modes

export type ThemePreset = {
  id: string;
  name: string;
  description: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
};

export type ThemeColors = {
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  ink900: string;
  ink800: string;
  ink700: string;
  ink600: string;
  ink500: string;
  ink400: string;
  accent: string;
  accentHover: string;
};

export type AccentColor = {
  id: string;
  name: string;
  color: string;
  hoverColor: string;
};

// Accent color options
export const accentColors: AccentColor[] = [
  { id: "orange", name: "Sunset", color: "#E36440", hoverColor: "#D15635" },
  { id: "blue", name: "Ocean", color: "#3B82F6", hoverColor: "#2563EB" },
  { id: "green", name: "Forest", color: "#10B981", hoverColor: "#059669" },
  { id: "purple", name: "Violet", color: "#8B5CF6", hoverColor: "#7C3AED" },
  { id: "pink", name: "Rose", color: "#EC4899", hoverColor: "#DB2777" },
  { id: "cyan", name: "Teal", color: "#06B6D4", hoverColor: "#0891B2" },
  { id: "amber", name: "Gold", color: "#F59E0B", hoverColor: "#D97706" },
  { id: "red", name: "Ruby", color: "#EF4444", hoverColor: "#DC2626" },
  { id: "crimson", name: "Crimson", color: "#DC143C", hoverColor: "#B91232" },
  { id: "matrix", name: "Matrix", color: "#00FF41", hoverColor: "#33FF66" },
  { id: "neon-pink", name: "Neon Pink", color: "#FF006E", hoverColor: "#E00060" },
  { id: "neon-blue", name: "Electric", color: "#00F0FF", hoverColor: "#00D4E0" },
  { id: "lavender", name: "Lavender", color: "#A78BFA", hoverColor: "#8B5CF6" },
  { id: "coral", name: "Coral", color: "#FF6B6B", hoverColor: "#EE5A5A" },
  { id: "mint", name: "Mint", color: "#72F1B8", hoverColor: "#5AE0A0" },
  { id: "peach", name: "Peach", color: "#FFAB91", hoverColor: "#FF8A65" },
  { id: "sky", name: "Sky", color: "#38BDF8", hoverColor: "#0EA5E9" },
];

// Theme presets
export const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "Coworker",
    description: "Clean and warm default theme",
    colors: {
      light: {
        surface: "#FFFFFF",
        surfaceSecondary: "#F8F7F4",
        surfaceTertiary: "#F1F0EC",
        ink900: "#121210",
        ink800: "#252422",
        ink700: "#42413E",
        ink600: "#61605C",
        ink500: "#7C7A75",
        ink400: "#96948F",
        accent: "#E36440",
        accentHover: "#D15635",
      },
      dark: {
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
      },
    },
  },
  {
    id: "dracula",
    name: "Dracula",
    description: "Dark theme with purple accents",
    colors: {
      light: {
        surface: "#F8F8F2",
        surfaceSecondary: "#F1F1EB",
        surfaceTertiary: "#E8E8E2",
        ink900: "#282A36",
        ink800: "#44475A",
        ink700: "#6272A4",
        ink600: "#7B8AB8",
        ink500: "#9AABCF",
        ink400: "#B8C5E0",
        accent: "#BD93F9",
        accentHover: "#A77BF3",
      },
      dark: {
        surface: "#282A36",
        surfaceSecondary: "#21222C",
        surfaceTertiary: "#343746",
        ink900: "#F8F8F2",
        ink800: "#F1F1EB",
        ink700: "#D4D4D8",
        ink600: "#9CA3AF",
        ink500: "#6272A4",
        ink400: "#44475A",
        accent: "#BD93F9",
        accentHover: "#A77BF3",
      },
    },
  },
  {
    id: "nord",
    name: "Nord",
    description: "Arctic, north-bluish color palette",
    colors: {
      light: {
        surface: "#ECEFF4",
        surfaceSecondary: "#E5E9F0",
        surfaceTertiary: "#D8DEE9",
        ink900: "#2E3440",
        ink800: "#3B4252",
        ink700: "#434C5E",
        ink600: "#4C566A",
        ink500: "#7B8494",
        ink400: "#9199A8",
        accent: "#5E81AC",
        accentHover: "#4C6F99",
      },
      dark: {
        surface: "#2E3440",
        surfaceSecondary: "#272C36",
        surfaceTertiary: "#3B4252",
        ink900: "#ECEFF4",
        ink800: "#E5E9F0",
        ink700: "#D8DEE9",
        ink600: "#9199A8",
        ink500: "#7B8494",
        ink400: "#4C566A",
        accent: "#88C0D0",
        accentHover: "#7EB5C5",
      },
    },
  },
  {
    id: "solarized",
    name: "Solarized",
    description: "Precision colors for machines and people",
    colors: {
      light: {
        surface: "#FDF6E3",
        surfaceSecondary: "#EEE8D5",
        surfaceTertiary: "#E4DFCB",
        ink900: "#073642",
        ink800: "#002B36",
        ink700: "#586E75",
        ink600: "#657B83",
        ink500: "#839496",
        ink400: "#93A1A1",
        accent: "#268BD2",
        accentHover: "#1E7AC1",
      },
      dark: {
        surface: "#002B36",
        surfaceSecondary: "#073642",
        surfaceTertiary: "#0A4453",
        ink900: "#FDF6E3",
        ink800: "#EEE8D5",
        ink700: "#93A1A1",
        ink600: "#839496",
        ink500: "#657B83",
        ink400: "#586E75",
        accent: "#2AA198",
        accentHover: "#23918A",
      },
    },
  },
  {
    id: "monokai",
    name: "Monokai",
    description: "Vibrant theme inspired by Monokai Pro",
    colors: {
      light: {
        surface: "#FFFFFF",
        surfaceSecondary: "#F5F5F5",
        surfaceTertiary: "#E8E8E8",
        ink900: "#272822",
        ink800: "#3E3D32",
        ink700: "#75715E",
        ink600: "#8F8F8F",
        ink500: "#A8A8A8",
        ink400: "#C0C0C0",
        accent: "#F92672",
        accentHover: "#E01B65",
      },
      dark: {
        surface: "#272822",
        surfaceSecondary: "#1E1F1C",
        surfaceTertiary: "#3E3D32",
        ink900: "#F8F8F2",
        ink800: "#E6E6E0",
        ink700: "#CFCFC2",
        ink600: "#A8A8A0",
        ink500: "#75715E",
        ink400: "#49483E",
        accent: "#A6E22E",
        accentHover: "#98D426",
      },
    },
  },
  {
    id: "github",
    name: "GitHub",
    description: "Clean theme inspired by GitHub",
    colors: {
      light: {
        surface: "#FFFFFF",
        surfaceSecondary: "#F6F8FA",
        surfaceTertiary: "#EAEEF2",
        ink900: "#1F2328",
        ink800: "#32383F",
        ink700: "#57606A",
        ink600: "#656D76",
        ink500: "#8B949E",
        ink400: "#AFB8C1",
        accent: "#0969DA",
        accentHover: "#0860CA",
      },
      dark: {
        surface: "#0D1117",
        surfaceSecondary: "#161B22",
        surfaceTertiary: "#21262D",
        ink900: "#F0F6FC",
        ink800: "#E6EDF3",
        ink700: "#C9D1D9",
        ink600: "#8B949E",
        ink500: "#6E7681",
        ink400: "#484F58",
        accent: "#58A6FF",
        accentHover: "#4C99F0",
      },
    },
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    description: "Soothing pastel theme for productivity",
    colors: {
      light: {
        surface: "#EFF1F5",
        surfaceSecondary: "#E6E9EF",
        surfaceTertiary: "#DCE0E8",
        ink900: "#4C4F69",
        ink800: "#5C5F77",
        ink700: "#6C6F85",
        ink600: "#7C7F93",
        ink500: "#8C8FA1",
        ink400: "#9CA0B0",
        accent: "#8839EF",
        accentHover: "#7832DB",
      },
      dark: {
        surface: "#1E1E2E",
        surfaceSecondary: "#181825",
        surfaceTertiary: "#313244",
        ink900: "#CDD6F4",
        ink800: "#BAC2DE",
        ink700: "#A6ADC8",
        ink600: "#9399B2",
        ink500: "#7F849C",
        ink400: "#6C7086",
        accent: "#CBA6F7",
        accentHover: "#B794F4",
      },
    },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    description: "A clean dark theme celebrating Tokyo at night",
    colors: {
      light: {
        surface: "#D5D6DB",
        surfaceSecondary: "#CBCCD1",
        surfaceTertiary: "#C0C1C7",
        ink900: "#343B58",
        ink800: "#444B6A",
        ink700: "#565F89",
        ink600: "#6B7394",
        ink500: "#8389A3",
        ink400: "#9AA1B8",
        accent: "#7AA2F7",
        accentHover: "#6B93E8",
      },
      dark: {
        surface: "#1A1B26",
        surfaceSecondary: "#16161E",
        surfaceTertiary: "#24283B",
        ink900: "#C0CAF5",
        ink800: "#A9B1D6",
        ink700: "#9AA5CE",
        ink600: "#787C99",
        ink500: "#565F89",
        ink400: "#414868",
        accent: "#7AA2F7",
        accentHover: "#6B93E8",
      },
    },
  },
  {
    id: "hacker",
    name: "Hacker",
    description: "Matrix-inspired terminal aesthetic with neon green",
    colors: {
      light: {
        // Light mode still has the hacker vibe but inverted
        surface: "#0D0D0D",
        surfaceSecondary: "#0A0A0A",
        surfaceTertiary: "#141414",
        ink900: "#00FF41",
        ink800: "#00DD36",
        ink700: "#00BB2D",
        ink600: "#009924",
        ink500: "#007A1D",
        ink400: "#005C16",
        accent: "#00FF41",
        accentHover: "#33FF66",
      },
      dark: {
        surface: "#0A0A0A",
        surfaceSecondary: "#050505",
        surfaceTertiary: "#111111",
        ink900: "#00FF41",
        ink800: "#00EE3B",
        ink700: "#00CC33",
        ink600: "#00AA2B",
        ink500: "#008822",
        ink400: "#006619",
        accent: "#00FF41",
        accentHover: "#33FF66",
      },
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon-lit streets of Night City",
    colors: {
      light: {
        surface: "#1A1A2E",
        surfaceSecondary: "#16162A",
        surfaceTertiary: "#252547",
        ink900: "#EAEAEA",
        ink800: "#D0D0D0",
        ink700: "#B0B0B0",
        ink600: "#909090",
        ink500: "#707070",
        ink400: "#505050",
        accent: "#FF006E",
        accentHover: "#FF3D8F",
      },
      dark: {
        surface: "#0D0D1A",
        surfaceSecondary: "#0A0A14",
        surfaceTertiary: "#1A1A2E",
        ink900: "#FCEE0A",
        ink800: "#E6D909",
        ink700: "#00F0FF",
        ink600: "#00C8D4",
        ink500: "#8B8B8B",
        ink400: "#5A5A5A",
        accent: "#FF006E",
        accentHover: "#FF3D8F",
      },
    },
  },
  {
    id: "synthwave",
    name: "Synthwave",
    description: "Retro 80s aesthetic with neon vibes",
    colors: {
      light: {
        surface: "#2B1E3D",
        surfaceSecondary: "#241832",
        surfaceTertiary: "#3D2A54",
        ink900: "#FFFFFF",
        ink800: "#E8E8E8",
        ink700: "#D4D4D4",
        ink600: "#B8B8B8",
        ink500: "#9C9C9C",
        ink400: "#808080",
        accent: "#FF7EDB",
        accentHover: "#FF9DE3",
      },
      dark: {
        surface: "#1A1025",
        surfaceSecondary: "#130B1A",
        surfaceTertiary: "#2B1E3D",
        ink900: "#F0E6FF",
        ink800: "#E0D6F0",
        ink700: "#72F1B8",
        ink600: "#FF7EDB",
        ink500: "#7B5EA7",
        ink400: "#5A4478",
        accent: "#FF7EDB",
        accentHover: "#FF9DE3",
      },
    },
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    description: "Retro groove with warm colors",
    colors: {
      light: {
        surface: "#FBF1C7",
        surfaceSecondary: "#EBDBB2",
        surfaceTertiary: "#D5C4A1",
        ink900: "#282828",
        ink800: "#3C3836",
        ink700: "#504945",
        ink600: "#665C54",
        ink500: "#7C6F64",
        ink400: "#928374",
        accent: "#D65D0E",
        accentHover: "#AF3A03",
      },
      dark: {
        surface: "#282828",
        surfaceSecondary: "#1D2021",
        surfaceTertiary: "#3C3836",
        ink900: "#EBDBB2",
        ink800: "#D5C4A1",
        ink700: "#BDAE93",
        ink600: "#A89984",
        ink500: "#928374",
        ink400: "#665C54",
        accent: "#FE8019",
        accentHover: "#D65D0E",
      },
    },
  },
  {
    id: "one-dark",
    name: "One Dark",
    description: "Atom's iconic dark theme",
    colors: {
      light: {
        surface: "#FAFAFA",
        surfaceSecondary: "#F0F0F0",
        surfaceTertiary: "#E5E5E6",
        ink900: "#383A42",
        ink800: "#4B4D55",
        ink700: "#696C77",
        ink600: "#9D9FA6",
        ink500: "#A0A1A7",
        ink400: "#C6C7CC",
        accent: "#4078F2",
        accentHover: "#3069E3",
      },
      dark: {
        surface: "#282C34",
        surfaceSecondary: "#21252B",
        surfaceTertiary: "#2C313A",
        ink900: "#ABB2BF",
        ink800: "#9DA5B4",
        ink700: "#848B98",
        ink600: "#6B727F",
        ink500: "#5C6370",
        ink400: "#4B5263",
        accent: "#61AFEF",
        accentHover: "#4BA3E8",
      },
    },
  },
  {
    id: "rose-pine",
    name: "Rosé Pine",
    description: "All natural pine, faux fur and a bit of soho vibes",
    colors: {
      light: {
        surface: "#FAF4ED",
        surfaceSecondary: "#FFFAF3",
        surfaceTertiary: "#F2E9E1",
        ink900: "#575279",
        ink800: "#6E6A86",
        ink700: "#797593",
        ink600: "#9893A5",
        ink500: "#B4AFBd",
        ink400: "#CECACD",
        accent: "#D7827E",
        accentHover: "#C76F6B",
      },
      dark: {
        surface: "#191724",
        surfaceSecondary: "#1F1D2E",
        surfaceTertiary: "#26233A",
        ink900: "#E0DEF4",
        ink800: "#C4C3D4",
        ink700: "#908CAA",
        ink600: "#6E6A86",
        ink500: "#524F67",
        ink400: "#403D52",
        accent: "#EBBCBA",
        accentHover: "#E0ACAA",
      },
    },
  },
  {
    id: "everforest",
    name: "Everforest",
    description: "Comfortable and pleasant green forest theme",
    colors: {
      light: {
        surface: "#FDF6E3",
        surfaceSecondary: "#F4F0D9",
        surfaceTertiary: "#E5DFC5",
        ink900: "#5C6A72",
        ink800: "#6B7A82",
        ink700: "#829181",
        ink600: "#939F91",
        ink500: "#A6B0A0",
        ink400: "#C9D0C0",
        accent: "#8DA101",
        accentHover: "#7C8F01",
      },
      dark: {
        surface: "#2D353B",
        surfaceSecondary: "#232A2E",
        surfaceTertiary: "#343F44",
        ink900: "#D3C6AA",
        ink800: "#C5B99A",
        ink700: "#9DA9A0",
        ink600: "#859289",
        ink500: "#6B7B75",
        ink400: "#4F5B58",
        accent: "#A7C080",
        accentHover: "#97B070",
      },
    },
  },
  {
    id: "ayu",
    name: "Ayu",
    description: "Simple, bright colors on dark background",
    colors: {
      light: {
        surface: "#FAFAFA",
        surfaceSecondary: "#F3F4F5",
        surfaceTertiary: "#E7E8E9",
        ink900: "#5C6166",
        ink800: "#6C7176",
        ink700: "#8A9199",
        ink600: "#9FA5AB",
        ink500: "#ACB0B5",
        ink400: "#C8CACC",
        accent: "#FF9940",
        accentHover: "#F08A30",
      },
      dark: {
        surface: "#0B0E14",
        surfaceSecondary: "#0D1017",
        surfaceTertiary: "#151820",
        ink900: "#BFBDB6",
        ink800: "#ACAAa4",
        ink700: "#73726E",
        ink600: "#5C5B58",
        ink500: "#454440",
        ink400: "#33322E",
        accent: "#E6B450",
        accentHover: "#D9A640",
      },
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep blue night sky with starlight",
    colors: {
      light: {
        surface: "#F0F4FC",
        surfaceSecondary: "#E4EAF6",
        surfaceTertiary: "#D4DCEC",
        ink900: "#1E293B",
        ink800: "#334155",
        ink700: "#475569",
        ink600: "#64748B",
        ink500: "#94A3B8",
        ink400: "#CBD5E1",
        accent: "#6366F1",
        accentHover: "#4F46E5",
      },
      dark: {
        surface: "#0F172A",
        surfaceSecondary: "#0B1120",
        surfaceTertiary: "#1E293B",
        ink900: "#F1F5F9",
        ink800: "#E2E8F0",
        ink700: "#CBD5E1",
        ink600: "#94A3B8",
        ink500: "#64748B",
        ink400: "#475569",
        accent: "#818CF8",
        accentHover: "#6366F1",
      },
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    description: "Warm gradient inspired by golden hour",
    colors: {
      light: {
        surface: "#FFFBF5",
        surfaceSecondary: "#FFF5EB",
        surfaceTertiary: "#FFEDE0",
        ink900: "#44403C",
        ink800: "#57534E",
        ink700: "#78716C",
        ink600: "#A8A29E",
        ink500: "#D6D3D1",
        ink400: "#E7E5E4",
        accent: "#EA580C",
        accentHover: "#C2410C",
      },
      dark: {
        surface: "#1C1917",
        surfaceSecondary: "#171412",
        surfaceTertiary: "#292524",
        ink900: "#FAFAF9",
        ink800: "#F5F5F4",
        ink700: "#E7E5E4",
        ink600: "#A8A29E",
        ink500: "#78716C",
        ink400: "#57534E",
        accent: "#FB923C",
        accentHover: "#F97316",
      },
    },
  },
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep sea blues and aquatic tones",
    colors: {
      light: {
        surface: "#F0FDFA",
        surfaceSecondary: "#E0FAF5",
        surfaceTertiary: "#CCFBF1",
        ink900: "#134E4A",
        ink800: "#166D65",
        ink700: "#0F766E",
        ink600: "#0D9488",
        ink500: "#5EEAD4",
        ink400: "#99F6E4",
        accent: "#0891B2",
        accentHover: "#0E7490",
      },
      dark: {
        surface: "#042F2E",
        surfaceSecondary: "#032726",
        surfaceTertiary: "#134E4A",
        ink900: "#F0FDFA",
        ink800: "#CCFBF1",
        ink700: "#5EEAD4",
        ink600: "#2DD4BF",
        ink500: "#14B8A6",
        ink400: "#0D9488",
        accent: "#22D3EE",
        accentHover: "#06B6D4",
      },
    },
  },
  {
    id: "crimson",
    name: "Crimson",
    description: "Bold and passionate red theme with elegant contrast",
    colors: {
      light: {
        surface: "#FFF5F5",
        surfaceSecondary: "#FFE5E8",
        surfaceTertiary: "#FFD6DB",
        ink900: "#450A0A",
        ink800: "#7F1D1D",
        ink700: "#991B1B",
        ink600: "#B91C1C",
        ink500: "#DC2626",
        ink400: "#EF4444",
        accent: "#DC143C",
        accentHover: "#B91232",
      },
      dark: {
        surface: "#1A0A0F",
        surfaceSecondary: "#260D15",
        surfaceTertiary: "#3D1620",
        ink900: "#FFF1F2",
        ink800: "#FFE4E6",
        ink700: "#FECDD3",
        ink600: "#FDA4AF",
        ink500: "#F87171",
        ink400: "#DC2626",
        accent: "#DC143C",
        accentHover: "#FF1F4F",
      },
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    description: "Ultra-dark theme optimized for nighttime coding with reduced eye strain",
    colors: {
      light: {
        surface: "#F5F5F0",
        surfaceSecondary: "#EAEAE0",
        surfaceTertiary: "#D8D8C8",
        ink900: "#1A1A18",
        ink800: "#2D2D28",
        ink700: "#404038",
        ink600: "#5C5C50",
        ink500: "#787868",
        ink400: "#94948A",
        accent: "#8B7355",
        accentHover: "#6F5E47",
      },
      dark: {
        surface: "#0D0D0D",
        surfaceSecondary: "#141414",
        surfaceTertiary: "#1C1C1C",
        ink900: "#C8C8C0",
        ink800: "#B0B0A8",
        ink700: "#989890",
        ink600: "#808078",
        ink500: "#686860",
        ink400: "#505048",
        accent: "#8B7355",
        accentHover: "#A08968",
      },
    },
  },
];

// Apply theme colors to CSS variables
export function applyThemePreset(presetId: string, mode: "light" | "dark", nightMode: boolean = false): void {
  const preset = themePresets.find((p) => p.id === presetId) ?? themePresets[0];
  const colors = preset.colors[mode];
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

  // Apply night mode filter
  applyNightMode(nightMode);
}

// Apply accent color only
export function applyAccentColor(accentId: string): void {
  const accent = accentColors.find((a) => a.id === accentId) ?? accentColors[0];
  const root = document.documentElement;

  root.style.setProperty("--color-accent-500", accent.color);
  root.style.setProperty("--color-accent-600", accent.hoverColor);
}

// Apply custom accent color directly
export function applyCustomAccentColor(color: string): void {
  const root = document.documentElement;
  // Generate a slightly darker hover color
  const hoverColor = adjustColorBrightness(color, -15);
  root.style.setProperty("--color-accent-500", color);
  root.style.setProperty("--color-accent-600", hoverColor);
}

// Helper to adjust color brightness
function adjustColorBrightness(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, "");

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Adjust brightness
  const adjust = (value: number) => {
    const adjusted = value + (value * percent) / 100;
    return Math.max(0, Math.min(255, Math.round(adjusted)));
  };

  // Convert back to hex
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

// Reset theme to CSS defaults (remove inline styles)
export function resetThemeToDefaults(): void {
  const root = document.documentElement;
  const properties = [
    "--color-surface",
    "--color-surface-secondary",
    "--color-surface-tertiary",
    "--color-ink-900",
    "--color-ink-800",
    "--color-ink-700",
    "--color-ink-600",
    "--color-ink-500",
    "--color-ink-400",
    "--color-accent-500",
    "--color-accent-600",
  ];

  properties.forEach((prop) => root.style.removeProperty(prop));
}

// Apply night mode filter for eye comfort
export function applyNightMode(enabled: boolean): void {
  const root = document.documentElement;

  if (enabled) {
    // Reduce brightness by 15% and add warm color temperature
    root.style.setProperty("--night-mode-brightness", "0.85");
    root.style.setProperty("--night-mode-filter", "sepia(0.15) saturate(0.9)");
    root.setAttribute("data-night-mode", "true");
  } else {
    root.style.setProperty("--night-mode-brightness", "1");
    root.style.setProperty("--night-mode-filter", "none");
    root.removeAttribute("data-night-mode");
  }
}

// Get current effective mode based on system preference
export function getEffectiveMode(
  mode: "light" | "dark" | "system"
): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
