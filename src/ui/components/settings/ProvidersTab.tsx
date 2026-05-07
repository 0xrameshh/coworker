import type { ProviderConfig, AppConfig } from "./types";

interface ProvidersTabProps {
  config: AppConfig | null;
  editingProviderId: string | null;
  addingProvider: boolean;
  saving: boolean;
  formId: string;
  formName: string;
  formApiKey: string;
  formBaseURL: string;
  formModel: string;
  formApiType: "anthropic" | "openai-compatible";
  setFormName: (name: string) => void;
  setFormApiKey: (key: string) => void;
  setFormBaseURL: (url: string) => void;
  setFormModel: (model: string) => void;
  setFormApiType: (type: "anthropic" | "openai-compatible") => void;
  onAddProvider: () => void;
  onEditProvider: (provider: ProviderConfig) => void;
  onDeleteProvider: (providerId: string) => void;
  onSelectProvider: (providerId: string) => void;
  onSaveProvider: () => void;
  onCancelEdit: () => void;
}

export function ProvidersTab({
  config,
  editingProviderId,
  addingProvider,
  saving,
  formName,
  formApiKey,
  formBaseURL,
  formModel,
  formApiType,
  setFormName,
  setFormApiKey,
  setFormBaseURL,
  setFormModel,
  setFormApiType,
  onAddProvider,
  onEditProvider,
  onDeleteProvider,
  onSelectProvider,
  onSaveProvider,
  onCancelEdit,
}: ProvidersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted uppercase tracking-wider">API Providers</p>
        <button
          type="button"
          className="text-xs text-accent-500 hover:text-accent-600 font-medium flex items-center gap-1"
          onClick={onAddProvider}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add Provider
        </button>
      </div>

      {/* Provider List */}
      <div className="space-y-2">
        {config?.providers.map((provider) => (
          <div
            key={provider.id}
            className={`p-3 rounded-xl border transition-colors cursor-pointer ${
              config.activeProvider === provider.id
                ? "border-accent-500 bg-accent-500/5"
                : "border-ink-900/10 hover:bg-surface-tertiary"
            }`}
            onClick={() => onSelectProvider(provider.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.activeProvider === provider.id && (
                  <span className="w-2 h-2 rounded-full bg-success" />
                )}
                <span className="text-sm font-medium text-ink-700">{provider.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-surface-tertiary text-muted">
                  {provider.apiType === "anthropic" ? "Anthropic" : "OpenAI"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-surface text-muted hover:text-ink-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProvider(provider);
                  }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded hover:bg-error/10 text-muted hover:text-error transition-colors disabled:opacity-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProvider(provider.id);
                  }}
                  disabled={config.providers.length <= 1}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-xs text-muted mt-1 truncate">{provider.baseURL}</p>
          </div>
        ))}
      </div>

      {/* Edit/Add Form */}
      {(editingProviderId || addingProvider) && (
        <div className="p-4 rounded-xl border border-accent-500 bg-accent-500/5 mt-3">
          <p className="text-xs font-medium text-muted mb-3">
            {addingProvider ? "Add New Provider" : "Edit Provider"}
          </p>

          <div className="grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-muted">Provider Name</span>
              <input
                type="text"
                className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent-500 focus:outline-none"
                placeholder="My Provider"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-muted">API Format</span>
              <select
                className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                value={formApiType}
                onChange={(e) => {
                  setFormApiType(e.target.value as "anthropic" | "openai-compatible");
                  if (e.target.value === "anthropic") {
                    setFormBaseURL("https://api.anthropic.com");
                  } else {
                    setFormBaseURL("https://api.openai.com/v1");
                  }
                }}
              >
                <option value="anthropic">Anthropic API</option>
                <option value="openai-compatible">OpenAI-Compatible API</option>
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-muted">API Key</span>
              <input
                type="password"
                className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent-500 focus:outline-none"
                placeholder="sk-..."
                value={formApiKey}
                onChange={(e) => setFormApiKey(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-muted">Base URL</span>
              <input
                type="url"
                className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent-500 focus:outline-none"
                placeholder="https://api.anthropic.com"
                value={formBaseURL}
                onChange={(e) => setFormBaseURL(e.target.value)}
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-muted">Model</span>
              <input
                type="text"
                className="rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 placeholder:text-muted-light focus:border-accent-500 focus:outline-none"
                placeholder="sonnet-4-20250514"
                value={formModel}
                onChange={(e) => setFormModel(e.target.value)}
              />
            </label>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="flex-1 rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
                onClick={onCancelEdit}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-accent-500 px-3 py-2 text-sm font-medium text-white hover:bg-accent-600 transition-colors disabled:opacity-50"
                onClick={onSaveProvider}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
