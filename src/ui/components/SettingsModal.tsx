import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "../store/useAppStore";
import type { AvatarData } from "./Avatar";
import {
  applyThemePreset,
  applyAccentColor,
  applyCustomAccentColor,
  applyNightMode,
  getEffectiveMode,
} from "../themes/presets";
import { ThemeEditor } from "./ThemeEditor";
import { DeveloperContext } from "./DeveloperContext";
import {
  AppearanceTab,
  ProfilesTab,
  ProvidersTab,
  SettingsTabs,
  type Theme,
  type SettingsTab,
  type ProviderConfig,
  type AppConfig,
} from "./settings";

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { userProfile, aiProfile, setUserProfile, setAiProfile, setActiveModel, cwd } = useAppStore();
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [addingProvider, setAddingProvider] = useState(false);

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState<Theme>("system");
  const [selectedPreset, setSelectedPreset] = useState("default");
  const [selectedAccent, setSelectedAccent] = useState("orange");
  const [customAccentColor, setCustomAccentColor] = useState("#E36440");
  const [nightMode, setNightMode] = useState(false);
  const [showDebugMessages, setShowDebugMessages] = useState(false);

  // Form state for editing/adding provider
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formApiKey, setFormApiKey] = useState("");
  const [formBaseURL, setFormBaseURL] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formApiType, setFormApiType] = useState<"anthropic" | "openai-compatible">("anthropic");

  const populateFormFromProvider = useCallback((provider: ProviderConfig) => {
    setFormId(provider.id);
    setFormName(provider.name);
    setFormApiKey(provider.apiKey);
    setFormBaseURL(provider.baseURL);
    setFormModel(provider.model);
    setFormApiType(provider.apiType);
  }, []);

  const loadConfig = useCallback(async () => {
    if (!window.electron?.getAppConfig) {
      setLoading(false);
      return;
    }
    try {
      const appConfig = await window.electron.getAppConfig();
      setConfig(appConfig);
      setSelectedTheme(appConfig?.theme || "system");
      setSelectedPreset(appConfig?.themePreset || "default");
      setSelectedAccent(appConfig?.accentColor || "orange");
      setCustomAccentColor(appConfig?.customAccentColor || "#E36440");
      setNightMode((appConfig as AppConfig)?.nightMode ?? false);
      setShowDebugMessages((appConfig as AppConfig)?.showDebugMessages ?? false);
      if (appConfig && appConfig.providers.length > 0) {
        const active = appConfig.providers.find(p => p.id === appConfig.activeProvider);
        if (active) {
          populateFormFromProvider(active);
          setActiveModel(active.model || "");
        }
      }

      const fullConfig = await window.electron.getFullConfig?.();
      if (fullConfig?.userProfile) {
        setUserProfile(fullConfig.userProfile);
      }
      if (fullConfig?.aiProfile) {
        setAiProfile(fullConfig.aiProfile);
      }
    } catch (err) {
      console.error("Failed to load config:", err);
      setError("Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }, [populateFormFromProvider, setUserProfile, setAiProfile, setActiveModel]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Apply theme changes in real-time
  useEffect(() => {
    const effectiveMode = getEffectiveMode(selectedTheme);
    applyThemePreset(selectedPreset, effectiveMode, nightMode);
    if (selectedAccent === "custom") {
      applyCustomAccentColor(customAccentColor);
    } else {
      applyAccentColor(selectedAccent);
    }
  }, [selectedTheme, selectedPreset, selectedAccent, customAccentColor, nightMode]);

  const handleThemeChange = async (newTheme: Theme) => {
    setSelectedTheme(newTheme);
    if (!window.electron?.saveTheme) return;
    try {
      await window.electron.saveTheme(newTheme);
      setConfig(config ? { ...config, theme: newTheme } : null);
    } catch (err) {
      console.error("Failed to update theme:", err);
    }
  };

  const handlePresetChange = async (presetId: string) => {
    setSelectedPreset(presetId);
    if (!config || !window.electron?.saveAppConfig) return;
    try {
      const newConfig = { ...config, themePreset: presetId };
      await window.electron.saveAppConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error("Failed to save preset:", err);
    }
  };

  const handleAccentChange = async (accentId: string) => {
    setSelectedAccent(accentId);
    if (!config || !window.electron?.saveAppConfig) return;
    try {
      const newConfig = { ...config, accentColor: accentId };
      await window.electron.saveAppConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error("Failed to save accent:", err);
    }
  };

  const handleCustomAccentChange = async (color: string) => {
    setCustomAccentColor(color);
    setSelectedAccent("custom");
    if (!config || !window.electron?.saveAppConfig) return;
    try {
      const newConfig = { ...config, accentColor: "custom", customAccentColor: color };
      await window.electron.saveAppConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error("Failed to save custom accent:", err);
    }
  };

  const handleNightModeChange = async (enabled: boolean) => {
    setNightMode(enabled);
    applyNightMode(enabled);
    if (!config || !window.electron?.saveAppConfig) return;
    try {
      const newConfig = { ...config, nightMode: enabled };
      await window.electron.saveAppConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error("Failed to save night mode:", err);
    }
  };

  const handleDebugMessagesChange = async (enabled: boolean) => {
    setShowDebugMessages(enabled);
    useAppStore.getState().setShowDebugMessages(enabled);
    if (!config || !window.electron?.saveAppConfig) return;
    try {
      const newConfig = { ...config, showDebugMessages: enabled };
      await window.electron.saveAppConfig(newConfig);
      setConfig(newConfig);
    } catch (err) {
      console.error("Failed to save debug messages setting:", err);
    }
  };

  const handleUserAvatarChange = async (avatar: AvatarData) => {
    const newProfile = { ...userProfile, avatar };
    setUserProfile({ avatar });
    if (!window.electron?.saveUserProfile) return;
    try {
      await window.electron.saveUserProfile(newProfile);
    } catch (err) {
      console.error("Failed to save user profile:", err);
    }
  };

  const handleAiAvatarChange = async (avatar: AvatarData) => {
    const newProfile = { ...aiProfile, avatar };
    setAiProfile({ avatar });
    if (!window.electron?.saveAiProfile) return;
    try {
      await window.electron.saveAiProfile(newProfile);
    } catch (err) {
      console.error("Failed to save AI profile:", err);
    }
  };

  const handleUserNameChange = async (name: string) => {
    const newProfile = { ...userProfile, name };
    setUserProfile({ name });
    if (!window.electron?.saveUserProfile) return;
    try {
      await window.electron.saveUserProfile(newProfile);
    } catch (err) {
      console.error("Failed to save user profile:", err);
    }
  };

  const handleAiNameChange = async (name: string) => {
    const newProfile = { ...aiProfile, name };
    setAiProfile({ name });
    if (!window.electron?.saveAiProfile) return;
    try {
      await window.electron.saveAiProfile(newProfile);
    } catch (err) {
      console.error("Failed to save AI profile:", err);
    }
  };

  const handleAiPersonalityChange = async (personality: "professional" | "casual" | "technical" | "creative") => {
    const newProfile = { ...aiProfile, personality };
    setAiProfile({ personality });
    if (!window.electron?.saveAiProfile) return;
    try {
      await window.electron.saveAiProfile(newProfile);
    } catch (err) {
      console.error("Failed to save AI profile:", err);
    }
  };

  const handleEditProvider = (provider: ProviderConfig) => {
    setEditingProviderId(provider.id);
    setAddingProvider(false);
    populateFormFromProvider(provider);
  };

  const handleAddProvider = () => {
    const newId = `provider-${Date.now()}`;
    setFormId(newId);
    setFormName("");
    setFormApiKey("");
    setFormBaseURL(formApiType === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1");
    setFormModel("");
    setFormApiType("anthropic");
    setAddingProvider(true);
    setEditingProviderId(null);
  };

  const handleCancelEdit = () => {
    setEditingProviderId(null);
    setAddingProvider(false);
    if (config?.activeProvider) {
      const active = config.providers.find(p => p.id === config.activeProvider);
      if (active) populateFormFromProvider(active);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!config || config.providers.length <= 1 || !window.electron?.removeProvider) {
      setError("Cannot delete the last provider");
      return;
    }

    try {
      const result = await window.electron.removeProvider(providerId);
      if (result.success) {
        await loadConfig();
      } else {
        setError(result.error || "Failed to delete provider");
      }
    } catch (err) {
      console.error("Failed to delete provider:", err);
      setError("Failed to delete provider");
    }
  };

  const handleSelectProvider = async (providerId: string) => {
    if (!config || !window.electron?.saveAppConfig) return;

    try {
      const newConfig = { ...config, activeProvider: providerId };
      const result = await window.electron.saveAppConfig(newConfig);
      if (result.success) {
        setConfig(newConfig);
        const selected = config.providers.find(p => p.id === providerId);
        if (selected) {
          populateFormFromProvider(selected);
          setActiveModel(selected.model || "");
        }
      } else {
        setError("Failed to select provider");
      }
    } catch (err) {
      console.error("Failed to select provider:", err);
      setError("Failed to select provider");
    }
  };

  const handleSaveProvider = async () => {
    if (!formApiKey.trim()) {
      setError("API Key is required");
      return;
    }
    if (!formBaseURL.trim()) {
      setError("Base URL is required");
      return;
    }
    if (!formModel.trim()) {
      setError("Model is required");
      return;
    }

    try {
      new URL(formBaseURL);
    } catch {
      setError("Invalid Base URL format");
      return;
    }

    setError(null);
    setSaving(true);

    const provider: ProviderConfig = {
      id: addingProvider ? formId : editingProviderId || formId,
      name: formName.trim() || "Unnamed Provider",
      apiKey: formApiKey.trim(),
      baseURL: formBaseURL.trim(),
      model: formModel.trim(),
      apiType: formApiType
    };

    try {
      if (addingProvider && window.electron?.addProvider) {
        const result = await window.electron.addProvider(provider);
        if (!result.success) {
          setError(result.error || "Failed to add provider");
          setSaving(false);
          return;
        }
      } else if (window.electron?.saveAppConfig) {
        const newProviders = config?.providers.map(p =>
          p.id === editingProviderId ? provider : p
        ) || [provider];
        const newActiveProvider = config?.activeProvider === editingProviderId ? provider.id : (config?.activeProvider || provider.id);
        const result = await window.electron.saveAppConfig({
          ...config,
          activeProvider: newActiveProvider,
          providers: newProviders,
        });
        if (!result.success) {
          setError("Failed to save provider");
          setSaving(false);
          return;
        }
      }

      await loadConfig();
      setEditingProviderId(null);
      setAddingProvider(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

      if (!addingProvider && config?.activeProvider === editingProviderId) {
        setActiveModel(provider.model);
      }
    } catch (err) {
      console.error("Failed to save provider:", err);
      setError("Failed to save provider");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-ink-900/10 bg-surface shadow-xl my-auto max-h-[90vh] overflow-hidden animate-scale-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-900/10">
          <div>
            <div className="text-base font-semibold text-ink-800">Settings</div>
            <p className="mt-1 text-sm text-muted">Customize your experience</p>
          </div>
          <button
            className="rounded-full p-1.5 text-muted hover:bg-surface-tertiary hover:text-ink-700 transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            type="button"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <SettingsTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent-500" viewBox="0 0 100 101" fill="none">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z" fill="currentColor" opacity="0.3" />
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
              </svg>
            </div>
          ) : (
            <>
              {activeTab === "appearance" && (
                <AppearanceTab
                  selectedTheme={selectedTheme}
                  selectedPreset={selectedPreset}
                  selectedAccent={selectedAccent}
                  customAccentColor={customAccentColor}
                  nightMode={nightMode}
                  showDebugMessages={showDebugMessages}
                  config={config}
                  onThemeChange={handleThemeChange}
                  onPresetChange={handlePresetChange}
                  onAccentChange={handleAccentChange}
                  onCustomAccentChange={handleCustomAccentChange}
                  setCustomAccentColor={setCustomAccentColor}
                  onNightModeChange={handleNightModeChange}
                  onDebugMessagesChange={handleDebugMessagesChange}
                />
              )}

              {activeTab === "theme-editor" && (
                <ThemeEditor
                  initialColors={config?.customThemeColors}
                  mode={selectedTheme}
                  onColorsChange={async (colors) => {
                    if (config && window.electron?.saveAppConfig) {
                      try {
                        const newConfig = { ...config, customThemeColors: colors, themePreset: "custom" };
                        await window.electron.saveAppConfig(newConfig);
                        setConfig(newConfig);
                        setSelectedPreset("custom");
                      } catch (err) {
                        console.error("Failed to save custom theme:", err);
                      }
                    }
                  }}
                  onSaveAsPreset={async (name, colors) => {
                    if (config && window.electron?.saveAppConfig) {
                      const newTheme = {
                        id: `custom-${Date.now()}`,
                        name,
                        colors: {
                          light: colors,
                          dark: colors,
                        },
                      };
                      const savedThemes = [...(config.savedThemes || []), newTheme];
                      try {
                        const newConfig = { ...config, savedThemes };
                        await window.electron.saveAppConfig(newConfig);
                        setConfig(newConfig);
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 2000);
                      } catch (err) {
                        console.error("Failed to save theme preset:", err);
                      }
                    }
                  }}
                />
              )}

              {activeTab === "developer" && (
                <DeveloperContext projectPath={cwd || null} />
              )}

              {activeTab === "profiles" && (
                <ProfilesTab
                  userProfile={userProfile}
                  aiProfile={aiProfile}
                  onUserAvatarChange={handleUserAvatarChange}
                  onAiAvatarChange={handleAiAvatarChange}
                  onUserNameChange={handleUserNameChange}
                  onAiNameChange={handleAiNameChange}
                  onAiPersonalityChange={handleAiPersonalityChange}
                />
              )}

              {activeTab === "providers" && (
                <ProvidersTab
                  config={config}
                  editingProviderId={editingProviderId}
                  addingProvider={addingProvider}
                  saving={saving}
                  formId={formId}
                  formName={formName}
                  formApiKey={formApiKey}
                  formBaseURL={formBaseURL}
                  formModel={formModel}
                  formApiType={formApiType}
                  setFormName={setFormName}
                  setFormApiKey={setFormApiKey}
                  setFormBaseURL={setFormBaseURL}
                  setFormModel={setFormModel}
                  setFormApiType={setFormApiType}
                  onAddProvider={handleAddProvider}
                  onEditProvider={handleEditProvider}
                  onDeleteProvider={handleDeleteProvider}
                  onSelectProvider={handleSelectProvider}
                  onSaveProvider={handleSaveProvider}
                  onCancelEdit={handleCancelEdit}
                />
              )}

              {/* Error/Success Messages */}
              {error && (
                <div className="mt-4 rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
                  Configuration saved successfully!
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-ink-900/10">
          <button
            className="flex-1 rounded-xl border border-ink-900/10 bg-surface px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
