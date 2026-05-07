import { useEffect, useState } from "react";
import { applyThemePreset, applyAccentColor } from "../themes/presets";

type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("light");
  const [preset, setPreset] = useState<string>("default");
  const [accent, setAccent] = useState<string>("orange");
  const [isLoading, setIsLoading] = useState(true);

  // Load theme settings on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Check if running in Electron context
        if (!window.electron?.getTheme) {
          // Browser fallback - use system preference
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(prefersDark ? 'dark' : 'light');
          setIsLoading(false);
          return;
        }

        // Get resolved theme (light/dark)
        const initialTheme = await window.electron.getTheme();
        setTheme(initialTheme);

        // Get full config to load preset and accent
        const appConfig = await window.electron.getAppConfig();
        if (appConfig) {
          const loadedPreset = appConfig.themePreset || "default";
          const loadedAccent = appConfig.accentColor || "orange";
          setPreset(loadedPreset);
          setAccent(loadedAccent);

          // Apply the theme preset and accent color
          applyThemePreset(loadedPreset, initialTheme);
          applyAccentColor(loadedAccent);
        }
      } catch (err) {
        console.error("Failed to load theme:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Apply dark/light class and re-apply preset when theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    // Re-apply preset for new mode
    if (preset) {
      applyThemePreset(preset, theme);
    }
  }, [theme, preset]);

  // Listen for theme changes from system/settings
  useEffect(() => {
    if (!window.electron?.onThemeChanged) return;
    const unsubscribe = window.electron.onThemeChanged((newTheme) => {
      setTheme(newTheme);
    });
    return unsubscribe;
  }, []);

  const updateTheme = async (newTheme: "light" | "dark" | "system") => {
    if (!window.electron?.saveTheme) {
      // Browser fallback
      setTheme(newTheme === "system"
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : newTheme);
      return;
    }
    const result = await window.electron.saveTheme(newTheme);
    if (result.success && result.theme) {
      setTheme(result.theme);
    }
  };

  return { theme, setTheme: updateTheme, preset, accent, isLoading };
}
