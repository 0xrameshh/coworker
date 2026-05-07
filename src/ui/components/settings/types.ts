import type { ThemeColors } from "../../themes/presets";

export type Theme = "light" | "dark" | "system";
export type SettingsTab = "appearance" | "theme-editor" | "developer" | "profiles" | "providers";

export interface ProviderConfig {
  id: string;
  name: string;
  apiType: "anthropic" | "openai-compatible";
  apiKey: string;
  baseURL: string;
  model: string;
}

export interface AppConfig {
  activeProvider: string;
  providers: ProviderConfig[];
  theme?: Theme;
  themePreset?: string;
  accentColor?: string;
  customAccentColor?: string;
  customThemeColors?: ThemeColors;
  savedThemes?: Array<{ id: string; name: string; colors: { light: ThemeColors; dark: ThemeColors } }>;
  nightMode?: boolean;
  showDebugMessages?: boolean;
}
