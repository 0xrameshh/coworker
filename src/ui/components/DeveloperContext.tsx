import { useState, useEffect, useCallback } from "react";

interface DeveloperContextProps {
  projectPath: string | null;
}

export function DeveloperContext({ projectPath }: DeveloperContextProps) {
  const [config, setConfig] = useState<DeveloperConfig | null>(null);
  const [summary, setSummary] = useState<DeveloperContextSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [activeSection, setActiveSection] = useState<"methodology" | "docs" | "repos" | "instructions">("methodology");

  // Repo management state
  const [repoStatus, setRepoStatus] = useState<Record<string, RepoStatus>>({});
  const [popularRepos, setPopularRepos] = useState<PopularRepo[]>([]);
  const [syncingRepos, setSyncingRepos] = useState(false);
  const [cloningRepo, setCloningRepo] = useState<string | null>(null);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [newRepo, setNewRepo] = useState({ name: "", url: "", branch: "main", sparsePaths: "" });

  const loadContext = useCallback(async () => {
    if (!projectPath) return;

    setLoading(true);
    setError(null);
    try {
      const [configResult, summaryResult, repoStatusResult, popularReposResult] = await Promise.all([
        window.electron.devContextLoad(projectPath),
        window.electron.devContextSummary(projectPath),
        window.electron.devContextGetRepoStatus(projectPath),
        window.electron.devContextGetPopularRepos(),
      ]);

      if (configResult.success && configResult.config) {
        setConfig(configResult.config);
      }
      if (summaryResult.success && summaryResult.summary) {
        setSummary(summaryResult.summary);
      }
      if (repoStatusResult.success && repoStatusResult.status) {
        setRepoStatus(repoStatusResult.status);
      }
      if (popularReposResult.success && popularReposResult.repos) {
        setPopularRepos(popularReposResult.repos);
      }
    } catch (err) {
      setError("Failed to load developer context");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    loadContext();
  }, [loadContext]);

  const saveConfig = async (newConfig: DeveloperConfig) => {
    if (!projectPath) return;

    try {
      const result = await window.electron.devContextSave(projectPath, newConfig);
      if (result.success) {
        setConfig(newConfig);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        // Reload summary
        const summaryResult = await window.electron.devContextSummary(projectPath);
        if (summaryResult.success && summaryResult.summary) {
          setSummary(summaryResult.summary);
        }
      } else {
        setError(result.error || "Failed to save");
      }
    } catch (err) {
      setError("Failed to save configuration");
    }
  };

  const initializeConfig = async () => {
    if (!projectPath) return;

    setLoading(true);
    try {
      const result = await window.electron.devContextInit(projectPath);
      if (result.success && result.config) {
        setConfig(result.config);
        // Reload summary
        const summaryResult = await window.electron.devContextSummary(projectPath);
        if (summaryResult.success && summaryResult.summary) {
          setSummary(summaryResult.summary);
        }
      }
    } catch (err) {
      setError("Failed to initialize configuration");
    } finally {
      setLoading(false);
    }
  };

  const updateMethodology = (updates: Partial<DeveloperMethodology>) => {
    if (!config) return;
    const newConfig = {
      ...config,
      profile: {
        ...config.profile,
        methodology: { ...config.profile.methodology, ...updates },
      },
    };
    saveConfig(newConfig);
  };

  const updateDocs = (updates: Partial<DocsContext>) => {
    if (!config) return;
    const newConfig = {
      ...config,
      profile: {
        ...config.profile,
        docs: { ...config.profile.docs, ...updates },
      },
    };
    saveConfig(newConfig);
  };

  const addCustomRule = () => {
    if (!config || !newRule.trim()) return;
    const newConfig = {
      ...config,
      profile: {
        ...config.profile,
        methodology: {
          ...config.profile.methodology,
          customRules: [...config.profile.methodology.customRules, newRule.trim()],
        },
      },
    };
    saveConfig(newConfig);
    setNewRule("");
  };

  const removeCustomRule = (index: number) => {
    if (!config) return;
    const newConfig = {
      ...config,
      profile: {
        ...config.profile,
        methodology: {
          ...config.profile.methodology,
          customRules: config.profile.methodology.customRules.filter((_, i) => i !== index),
        },
      },
    };
    saveConfig(newConfig);
  };

  const updateAiInstructions = (instructions: string) => {
    if (!config) return;
    const newConfig = {
      ...config,
      profile: {
        ...config.profile,
        aiInstructions: instructions,
      },
    };
    saveConfig(newConfig);
  };

  // Repo management functions
  const addPopularRepo = async (repo: PopularRepo) => {
    if (!projectPath || !config) return;

    setCloningRepo(repo.name);
    try {
      const addResult = await window.electron.devContextAddRepo(projectPath, {
        name: repo.name,
        url: repo.url,
        branch: repo.branch,
        sparsePaths: repo.sparsePaths,
      });

      if (addResult.success && addResult.config) {
        setConfig(addResult.config);

        // Clone the repo
        const cloneResult = await window.electron.devContextCloneRepo(projectPath, {
          ...repo,
          status: "pending",
        });

        if (cloneResult.success) {
          // Refresh status
          const statusResult = await window.electron.devContextGetRepoStatus(projectPath);
          if (statusResult.success && statusResult.status) {
            setRepoStatus(statusResult.status);
          }
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        } else {
          setError(cloneResult.error || "Failed to clone repository");
        }
      }
    } catch (err) {
      setError("Failed to add repository");
    } finally {
      setCloningRepo(null);
    }
  };

  const addCustomRepo = async () => {
    if (!projectPath || !newRepo.name || !newRepo.url) return;

    setCloningRepo(newRepo.name);
    try {
      const sparsePaths = newRepo.sparsePaths
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);

      const addResult = await window.electron.devContextAddRepo(projectPath, {
        name: newRepo.name,
        url: newRepo.url,
        branch: newRepo.branch || "main",
        sparsePaths,
      });

      if (addResult.success && addResult.config) {
        setConfig(addResult.config);

        // Clone the repo
        const cloneResult = await window.electron.devContextCloneRepo(projectPath, {
          name: newRepo.name,
          url: newRepo.url,
          branch: newRepo.branch || "main",
          sparsePaths,
          status: "pending",
        });

        if (cloneResult.success) {
          const statusResult = await window.electron.devContextGetRepoStatus(projectPath);
          if (statusResult.success && statusResult.status) {
            setRepoStatus(statusResult.status);
          }
          setNewRepo({ name: "", url: "", branch: "main", sparsePaths: "" });
          setShowAddRepo(false);
          setSuccess(true);
          setTimeout(() => setSuccess(false), 2000);
        } else {
          setError(cloneResult.error || "Failed to clone repository");
        }
      }
    } catch (err) {
      setError("Failed to add repository");
    } finally {
      setCloningRepo(null);
    }
  };

  const removeRepo = async (repoName: string) => {
    if (!projectPath) return;

    try {
      const result = await window.electron.devContextRemoveRepo(projectPath, repoName);
      if (result.success && result.config) {
        setConfig(result.config);
        // Remove from status
        const newStatus = { ...repoStatus };
        delete newStatus[repoName];
        setRepoStatus(newStatus);
      }
    } catch (err) {
      setError("Failed to remove repository");
    }
  };

  const syncAllRepos = async () => {
    if (!projectPath) return;

    setSyncingRepos(true);
    try {
      const result = await window.electron.devContextSyncRepos(projectPath);
      if (result.success) {
        const statusResult = await window.electron.devContextGetRepoStatus(projectPath);
        if (statusResult.success && statusResult.status) {
          setRepoStatus(statusResult.status);
        }
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } else {
        setError(result.error || "Failed to sync repositories");
      }
    } catch (err) {
      setError("Failed to sync repositories");
    } finally {
      setSyncingRepos(false);
    }
  };

  if (!projectPath) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 rounded-xl bg-surface-tertiary mb-4">
          <svg className="w-8 h-8 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-ink-700 mb-1">No Project Selected</div>
        <p className="text-xs text-muted">Start a session to configure developer context</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <svg aria-hidden="true" className="w-6 h-6 animate-spin text-accent-500" viewBox="0 0 100 101" fill="none">
          <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908Z" fill="currentColor" opacity="0.3" />
          <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-surface-secondary border border-ink-900/5">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">Tech Stack</div>
            <div className="flex flex-wrap gap-1">
              {summary.techStack.slice(0, 5).map((tech) => (
                <span key={tech} className="px-2 py-0.5 text-xs rounded-md bg-accent-500/10 text-accent-500 font-medium">
                  {tech}
                </span>
              ))}
              {summary.techStack.length > 5 && (
                <span className="px-2 py-0.5 text-xs rounded-md bg-surface-tertiary text-muted">
                  +{summary.techStack.length - 5} more
                </span>
              )}
              {summary.techStack.length === 0 && (
                <span className="text-xs text-muted">Not detected</span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-ink-900/5">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">Context Loaded</div>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-ink-700">{summary.docsCount} docs</span>
              <span className="text-ink-400">•</span>
              <span className="text-ink-700">{summary.rulesCount} rules</span>
              {summary.hasCustomInstructions && (
                <>
                  <span className="text-ink-400">•</span>
                  <span className="text-accent-500">Custom AI</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Initialize Button (if no config) */}
      {!config && (
        <div className="p-4 rounded-xl border-2 border-dashed border-ink-900/10 text-center">
          <p className="text-sm text-muted mb-3">
            No developer context configured for this project.
          </p>
          <button
            type="button"
            onClick={initializeConfig}
            className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors"
          >
            Initialize Developer Context
          </button>
        </div>
      )}

      {/* Config Editor */}
      {config && (
        <>
          {/* Section Tabs */}
          <div className="flex gap-1 p-1 bg-surface-secondary rounded-xl">
            {[
              { id: "methodology" as const, label: "Methodology", icon: "📐" },
              { id: "docs" as const, label: "Docs", icon: "📚" },
              { id: "repos" as const, label: "Repos", icon: "📦" },
              { id: "instructions" as const, label: "AI", icon: "🤖" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                  activeSection === tab.id
                    ? "bg-surface text-ink-800 shadow-sm"
                    : "text-muted hover:text-ink-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Methodology Section */}
          {activeSection === "methodology" && (
            <div className="space-y-4">
              {/* Built-in Rules */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">
                  Coding Standards
                </label>

                {/* Max File Lines */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5">
                  <div>
                    <div className="text-sm font-medium text-ink-800">Maximum File Size</div>
                    <div className="text-xs text-muted">Keep files under this many lines</div>
                  </div>
                  <input
                    type="number"
                    value={config.profile.methodology.maxFileLines}
                    onChange={(e) => updateMethodology({ maxFileLines: parseInt(e.target.value) || 350 })}
                    className="w-20 px-3 py-1.5 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 text-center focus:border-accent-500 focus:outline-none"
                    min={100}
                    max={1000}
                  />
                </div>

                {/* Test After Edit */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5">
                  <div>
                    <div className="text-sm font-medium text-ink-800">Test After Edits</div>
                    <div className="text-xs text-muted">Run tests after meaningful code changes</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateMethodology({ testAfterEdit: !config.profile.methodology.testAfterEdit })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      config.profile.methodology.testAfterEdit ? "bg-accent-500" : "bg-ink-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                        config.profile.methodology.testAfterEdit ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>

                {/* Clean Folder Structure */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5">
                  <div>
                    <div className="text-sm font-medium text-ink-800">Clean Folder Structure</div>
                    <div className="text-xs text-muted">Maintain organized project structure</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateMethodology({ cleanFolderStructure: !config.profile.methodology.cleanFolderStructure })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      config.profile.methodology.cleanFolderStructure ? "bg-accent-500" : "bg-ink-400"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                        config.profile.methodology.cleanFolderStructure ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Custom Rules */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">
                  Custom Rules
                </label>

                {config.profile.methodology.customRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5"
                  >
                    <span className="text-sm text-ink-700 flex-1">{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeCustomRule(index)}
                      className="p-1 rounded hover:bg-error/10 text-muted hover:text-error transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomRule()}
                    placeholder="Add a custom coding rule..."
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addCustomRule}
                    disabled={!newRule.trim()}
                    className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Docs Section */}
          {activeSection === "docs" && (
            <div className="space-y-4">
              {/* Docs Path */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">
                  Documentation Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.profile.docs.docsPath}
                    onChange={(e) => updateDocs({ docsPath: e.target.value })}
                    placeholder="./docs"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 font-mono focus:border-accent-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!projectPath) return;
                      const result = await window.electron.devContextIndexDocs(
                        projectPath,
                        config.profile.docs.docsPath
                      );
                      if (result.success && result.indexedFiles) {
                        updateDocs({ indexedFiles: result.indexedFiles });
                      }
                    }}
                    className="px-4 py-2 rounded-lg border border-ink-900/10 text-sm font-medium text-ink-700 hover:bg-surface-tertiary transition-colors"
                  >
                    Re-index
                  </button>
                </div>
              </div>

              {/* Indexed Files */}
              {config.profile.docs.indexedFiles.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">
                    Indexed Files ({config.profile.docs.indexedFiles.length})
                  </label>
                  <div className="max-h-40 overflow-y-auto p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5">
                    {config.profile.docs.indexedFiles.map((file) => (
                      <div key={file} className="text-xs font-mono text-ink-600 py-0.5">
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context7 Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5">
                <div>
                  <div className="text-sm font-medium text-ink-800">Use Context7 MCP</div>
                  <div className="text-xs text-muted">Fallback to Context7 for npm package docs</div>
                </div>
                <button
                  type="button"
                  onClick={() => updateDocs({ useContext7: !config.profile.docs.useContext7 })}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    config.profile.docs.useContext7 ? "bg-accent-500" : "bg-ink-400"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                      config.profile.docs.useContext7 ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Repos Section */}
          {activeSection === "repos" && (
            <div className="space-y-4">
              {/* Header with Sync button */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-muted uppercase tracking-wider">
                    Doc Repositories
                  </label>
                  <p className="text-xs text-muted mt-0.5">
                    Auto-clone documentation repos for AI reference
                  </p>
                </div>
                {(config.profile.docs.repositories?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={syncAllRepos}
                    disabled={syncingRepos}
                    className="px-3 py-1.5 rounded-lg bg-accent-500 text-white text-xs font-medium hover:bg-accent-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {syncingRepos ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                        </svg>
                        Syncing...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 4v6h-6M1 20v-6h6" />
                          <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                        </svg>
                        Sync All
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Configured Repositories */}
              {(config.profile.docs.repositories?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  {config.profile.docs.repositories?.map((repo) => {
                    const status = repoStatus[repo.name];
                    return (
                      <div
                        key={repo.name}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-secondary/50 border border-ink-900/5"
                      >
                        {/* Status indicator */}
                        <div
                          className={`w-2 h-2 rounded-full ${
                            status?.exists ? "bg-green-500" : "bg-amber-500"
                          }`}
                        />

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-ink-800">{repo.name}</div>
                          <div className="text-xs text-muted truncate">{repo.url}</div>
                        </div>

                        {/* Actions */}
                        <button
                          type="button"
                          onClick={() => removeRepo(repo.name)}
                          className="p-1.5 rounded hover:bg-red-100 text-muted hover:text-red-600 transition-colors"
                          title="Remove repository"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Popular Repos */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">
                  Popular Repositories
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {popularRepos
                    .filter((repo) => !config.profile.docs.repositories?.some((r) => r.name === repo.name))
                    .map((repo) => (
                      <button
                        key={repo.name}
                        type="button"
                        onClick={() => addPopularRepo(repo)}
                        disabled={cloningRepo === repo.name}
                        className="flex items-center gap-2 p-3 rounded-xl border border-ink-900/10 hover:border-accent-500 hover:bg-accent-500/5 transition-colors text-left disabled:opacity-50"
                      >
                        {cloningRepo === repo.name ? (
                          <svg className="w-4 h-4 text-accent-500 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" opacity="0.3" />
                            <path d="M12 2a10 10 0 0110 10" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                          </svg>
                        )}
                        <div>
                          <div className="text-sm font-medium text-ink-800 capitalize">{repo.name}</div>
                          <div className="text-xs text-muted">{repo.sparsePaths[0] || "Full repo"}</div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Add Custom Repo */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowAddRepo(!showAddRepo)}
                  className="flex items-center gap-2 text-xs font-medium text-accent-500 hover:text-accent-600 transition-colors"
                >
                  <svg className={`w-3 h-3 transition-transform ${showAddRepo ? "rotate-45" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add Custom Repository
                </button>

                {showAddRepo && (
                  <div className="p-4 rounded-xl bg-surface-secondary/50 border border-ink-900/5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newRepo.name}
                        onChange={(e) => setNewRepo({ ...newRepo, name: e.target.value })}
                        placeholder="Name (e.g., my-docs)"
                        className="px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={newRepo.branch}
                        onChange={(e) => setNewRepo({ ...newRepo, branch: e.target.value })}
                        placeholder="Branch (default: main)"
                        className="px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={newRepo.url}
                      onChange={(e) => setNewRepo({ ...newRepo, url: e.target.value })}
                      placeholder="Git URL (https://github.com/...)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={newRepo.sparsePaths}
                      onChange={(e) => setNewRepo({ ...newRepo, sparsePaths: e.target.value })}
                      placeholder="Sparse paths (comma-separated, e.g., docs/, README.md)"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addCustomRepo}
                        disabled={!newRepo.name || !newRepo.url || cloningRepo !== null}
                        className="px-4 py-2 rounded-lg bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
                      >
                        {cloningRepo ? "Cloning..." : "Add & Clone"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Instructions Section */}
          {activeSection === "instructions" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted uppercase tracking-wider">
                  Custom AI Instructions
                </label>
                <p className="text-xs text-muted">
                  These instructions will be automatically injected into every session.
                </p>
                <textarea
                  value={config.profile.aiInstructions}
                  onChange={(e) => updateAiInstructions(e.target.value)}
                  placeholder="Example: Always use TypeScript strict mode. Prefer functional components over class components. Use early returns to reduce nesting..."
                  className="w-full h-48 px-3 py-2 text-sm rounded-xl border border-ink-900/10 bg-surface text-ink-800 focus:border-accent-500 focus:outline-none resize-none"
                />
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-surface-tertiary border border-ink-900/5">
                <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Preview (what AI will see)
                </div>
                <pre className="text-xs font-mono text-ink-600 whitespace-pre-wrap">
                  {`=== DEVELOPER CONTEXT ===

CODING METHODOLOGY:
- Maximum file size: ${config.profile.methodology.maxFileLines} lines
${config.profile.methodology.testAfterEdit ? "- Run tests after meaningful changes\n" : ""}${config.profile.methodology.cleanFolderStructure ? "- Maintain clean folder structure\n" : ""}${config.profile.methodology.customRules.map((r) => `- ${r}`).join("\n")}

${config.profile.aiInstructions ? `ADDITIONAL INSTRUCTIONS:\n${config.profile.aiInstructions}` : ""}`}
                </pre>
              </div>
            </div>
          )}
        </>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-xl border border-error/20 bg-error-light px-4 py-2.5 text-sm text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-success/20 bg-success-light px-4 py-2.5 text-sm text-success">
          Configuration saved!
        </div>
      )}
    </div>
  );
}
