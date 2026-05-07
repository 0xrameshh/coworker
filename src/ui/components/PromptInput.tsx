import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientEvent } from "../types";
import { usePromptActions } from "../hooks/usePromptActions";
import { useAppStore } from "../store/useAppStore";

// Model options by provider type
const ANTHROPIC_MODELS = [
  { id: "claude-opus-4-5-20251101", name: "Claude Opus 4.5", short: "Opus 4.5" },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", short: "Sonnet 4.5" },
];

const OPENAI_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", short: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", short: "4o Mini" },
  { id: "o1", name: "O1", short: "O1" },
  { id: "o1-mini", name: "O1 Mini", short: "O1 Mini" },
];

interface PromptInputProps {
  sendEvent: (event: ClientEvent) => void;
}

export function PromptInput({ sendEvent }: PromptInputProps) {
  const { isRunning, handleSend, handleStop } = usePromptActions(sendEvent);
  const [localValue, setLocalValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState(ANTHROPIC_MODELS[0].id);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [providerType, setProviderType] = useState<"anthropic" | "openai-compatible">("anthropic");
  const promptRef = useRef<HTMLTextAreaElement | null>(null);
  const modelPickerRef = useRef<HTMLDivElement | null>(null);
  const inputContainerRef = useRef<HTMLDivElement | null>(null);

  // Get available models based on provider type
  const availableModels = providerType === "anthropic" ? ANTHROPIC_MODELS : OPENAI_MODELS;

  // Sync with store's activeModel and reload provider on change
  const activeModel = useAppStore(s => s.activeModel);
  useEffect(() => {
    if (activeModel) {
      setSelectedModel(activeModel);

      // Also reload provider type in case it changed in settings
      if (window.electron?.getAppConfig) {
        window.electron.getAppConfig().then((config) => {
          if (config?.providers?.length) {
            const active = config.providers.find(p => p.id === config.activeProvider);
            if (active?.apiType) {
              setProviderType(active.apiType);
            }
          }
        });
      }
    }
  }, [activeModel]);

  // Load model and provider type from config on mount
  useEffect(() => {
    if (!window.electron?.getAppConfig) return;
    window.electron.getAppConfig().then((config) => {
      if (config?.providers?.length) {
        const active = config.providers.find(p => p.id === config.activeProvider);
        if (active) {
          // Set provider type
          setProviderType(active.apiType);

          // Set model
          if (active.model) {
            setSelectedModel(active.model);
            useAppStore.getState().setActiveModel(active.model);
          } else {
            // Set default model based on provider
            const defaultModel = active.apiType === "anthropic"
              ? ANTHROPIC_MODELS[0].id
              : OPENAI_MODELS[0].id;
            setSelectedModel(defaultModel);
            useAppStore.getState().setActiveModel(defaultModel);
          }
        }
      }
    });
  }, []);

  // Close model picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelPickerRef.current && !modelPickerRef.current.contains(e.target as Node)) {
        setShowModelPicker(false);
      }
    };
    if (showModelPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelPicker]);

  const handleModelChange = async (modelId: string) => {
    setSelectedModel(modelId);
    setShowModelPicker(false);
    // Update store
    useAppStore.getState().setActiveModel(modelId);
    // Save to config
    if (!window.electron?.getAppConfig || !window.electron?.saveAppConfig) return;
    try {
      const config = await window.electron.getAppConfig();
      if (config?.providers?.length) {
        const activeIndex = config.providers.findIndex(p => p.id === config.activeProvider);
        if (activeIndex >= 0) {
          config.providers[activeIndex].model = modelId;
          await window.electron.saveAppConfig(config);
        }
      }
    } catch (err) {
      console.error("Failed to save model:", err);
    }
  };

  // Display logic: show the short name if available, otherwise show a readable version of the custom model
  const matchedModel = availableModels.find(m => m.id === selectedModel);
  const currentModelName = matchedModel
    ? matchedModel.short
    : selectedModel.includes("claude")
      ? selectedModel.split("-").slice(1, 3).join(" ").replace(/^\w/, c => c.toUpperCase())
      : selectedModel.replace(/-/g, " ").split(" ").slice(0, 2).join(" ");

  // Sync initial prompt if any (e.g. from modal)
  const storePrompt = useAppStore(s => s.prompt);
  const prevStorePromptRef = useRef(storePrompt);
  const showStartModal = useAppStore(s => s.showStartModal);
  useEffect(() => {
    // Only sync when storePrompt changes from a non-empty value and start modal is NOT open
    if (!showStartModal && storePrompt && storePrompt !== prevStorePromptRef.current && storePrompt !== localValue) {
      setLocalValue(storePrompt);
      // Clear store prompt after syncing
      useAppStore.getState().setPrompt("");
    }
    prevStorePromptRef.current = storePrompt;
  }, [storePrompt, localValue, showStartModal]);

  const adjustHeight = () => {
    const textarea = promptRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [localValue, attachments]);

  const handleSelectImage = async () => {
    if (!window.electron?.selectImage) return;
    try {
      const result = await window.electron.selectImage();
      if (result) {
        setAttachments(prev => [...prev, result]);
      }
    } catch (error) {
      console.error("Failed to select image:", error);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Handle paste for images from clipboard
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    let foundBrowserImage = false;

    // First try the browser clipboard API
    if (items) {
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          foundBrowserImage = true;
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              if (base64) {
                setAttachments(prev => [...prev, base64]);
              }
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    }

    // Always try Electron's clipboard API for system screenshots (macOS Cmd+Shift+4, etc.)
    // This is needed because browser clipboard API doesn't have access to native screenshots
    if (!foundBrowserImage && window.electron?.readClipboardImage) {
      try {
        const imageData = await window.electron.readClipboardImage();
        if (imageData) {
          e.preventDefault();
          setAttachments(prev => [...prev, imageData]);
        }
      } catch (error) {
        console.error("Failed to read clipboard image:", error);
      }
    }
  }, []);

  const onSend = () => {
    if (localValue.trim() || attachments.length > 0) {
      handleSend(localValue, attachments);
      setLocalValue("");
      setAttachments([]);
    }
  };

  // Handle drag and drop for images
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
              setAttachments(prev => [...prev, base64]);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (isRunning) { handleStop(); return; }
    onSend();
  };

  return (
    <section className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-surface-cream via-surface-cream/95 to-transparent pb-6 px-4 lg:pb-8 pt-16 z-40 lg:ml-64 ml-0 pointer-events-none">
      <div
        ref={inputContainerRef}
        className={`relative mx-auto flex w-full max-w-full flex-col rounded-2xl border glass shadow-2xl transition-all duration-300 focus-within:shadow-glow lg:max-w-3xl pointer-events-auto bg-surface/50 ${
          isDragging
            ? "border-accent-500 border-2 bg-accent-500/5"
            : "border-ink-900/10"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Drag overlay indicator */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-accent-500/10 rounded-2xl z-10 pointer-events-none">
            <div className="flex flex-col items-center gap-2 text-accent-600">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-sm font-medium">Drop image here</span>
            </div>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="relative group">
                <img
                  src={attachment}
                  alt={`Attachment ${index + 1}`}
                  className="h-16 w-16 rounded-lg object-cover border border-ink-900/10"
                />
                <button
                  onClick={() => handleRemoveAttachment(index)}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-error text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-sm hover:bg-error/90"
                  aria-label="Remove attachment"
                >
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3l6 6M9 3l-6 6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 p-2 pl-3">
          {/* Model selector */}
          <div className="relative" ref={modelPickerRef}>
            <button
              className="flex h-10 items-center gap-1.5 px-3 shrink-0 rounded-xl bg-surface-tertiary text-ink-600 hover:text-ink-800 hover:bg-surface-secondary transition-all text-xs font-medium"
              onClick={() => setShowModelPicker(!showModelPicker)}
              title="Select model"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2z" opacity="0.3" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
              <span className="max-w-[80px] truncate">{currentModelName}</span>
              <svg className={`h-3 w-3 transition-transform ${showModelPicker ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {showModelPicker && (
              <div className="absolute bottom-full left-0 mb-2 w-52 bg-surface border border-ink-900/10 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-1.5">
                  {/* Provider indicator */}
                  <div className="px-3 py-1 text-xs text-muted uppercase tracking-wider mb-1">
                    {providerType === "anthropic" ? "Anthropic" : "OpenAI Compatible"}
                  </div>

                  {/* Show current custom model if it's not in the predefined list */}
                  {!availableModels.find(m => m.id === selectedModel) && (
                    <button
                      className="w-full text-left px-3 py-2 text-sm rounded-lg bg-accent-500/10 text-accent-600 font-medium mb-1"
                      onClick={() => setShowModelPicker(false)}
                    >
                      {selectedModel} (Current)
                    </button>
                  )}

                  {/* Available models for this provider */}
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedModel === model.id
                          ? "bg-accent-500/10 text-accent-600 font-medium"
                          : "text-ink-700 hover:bg-surface-secondary"
                      }`}
                      onClick={() => handleModelChange(model.id)}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Image upload button */}
          <button
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${attachments.length > 0
                ? "bg-accent-500/10 text-accent-500 hover:bg-accent-500 hover:text-white"
                : "bg-surface-tertiary text-ink-400 hover:text-ink-600 hover:bg-surface-secondary"
              }`}
            onClick={handleSelectImage}
            aria-label="Attach image"
            title="Attach image"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </button>

          <textarea
            rows={1}
            className="flex-1 resize-none bg-transparent py-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0 focus:border-transparent transition-colors duration-200 leading-relaxed min-h-[44px] max-h-[200px]"
            placeholder="Ask Kai to build something..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            ref={promptRef}
          />
          <button
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 transform active:scale-90 shadow-lg ${isRunning
              ? "bg-error text-white hover:bg-error/90 hover:shadow-error/20"
              : localValue.trim() || attachments.length > 0
                ? "bg-accent-500 text-white hover:bg-accent-600 hover:shadow-glow"
                : "bg-surface-tertiary text-ink-400 cursor-not-allowed"
              }`}
            onClick={isRunning ? handleStop : onSend}
            disabled={!isRunning && !localValue.trim() && attachments.length === 0}
            aria-label={isRunning ? "Stop session" : "Send prompt"}
          >
            {isRunning ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}