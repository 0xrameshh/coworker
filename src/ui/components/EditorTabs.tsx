
import { showToast } from '../store/useToastStore';

interface EditorTab {
  id: string;
  title: string;
  filePath: string;
  isDirty: boolean;
  isActive: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabSave?: (tabId: string) => void;
  onOpenFile?: (filePath: string) => void;
  className?: string;
}

export function EditorTabs({
  tabs,
  onTabClick,
  onTabClose,
  onTabSave,
  onOpenFile,
  className = ''
}: EditorTabsProps) {
  // File picker handler
  const handleOpenFile = async () => {
    if (!window.electron?.selectDirectory) {
      showToast('File operations require Electron environment', 'error');
      return;
    }

    try {
      // For now, use directory picker + filename prompt
      // In a full implementation, you'd use a proper file picker dialog
      const dirPath = await window.electron.selectDirectory();
      if (!dirPath) return;

      // Get list of files in the directory
      const result = await window.electron.listFiles(dirPath);
      if (!result.success || !result.items || result.items.length === 0) {
        showToast('No files found in directory', 'info');
        return;
      }

      // Filter only files (not directories) and get their names
      const fileNames = result.items
        .filter(item => item.isFile)
        .map(item => item.name);

      if (fileNames.length === 0) {
        showToast('No files found in directory', 'info');
        return;
      }

      // Show file list in a simple prompt (in production, use a proper modal)
      const fileName = prompt(`Enter filename from ${dirPath}:\n\nAvailable files:\n${fileNames.join('\n')}`);
      if (!fileName) return;

      const filePath = `${dirPath}/${fileName}`;

      // Check if file exists
      const stats = await window.electron.getFileStats(filePath);
      if (stats?.success) {
        onOpenFile?.(filePath);
        showToast(`Opened ${fileName}`, 'success');
      } else {
        showToast(`File not found: ${fileName}`, 'error');
      }
    } catch (error) {
      showToast(`Failed to open file: ${error}`, 'error');
    }
  };
  if (tabs.length === 0) {
    return (
      <div className={`h-10 border-b border-ink-900/10 bg-surface-secondary/50 ${className}`}>
        <div className="flex items-center justify-center h-full text-sm text-muted">
          No files open
        </div>
      </div>
    );
  }

  return (
    <div className={`flex overflow-x-auto border-b border-ink-900/10 bg-surface-secondary/50 ${className}`}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`flex items-center min-w-0 max-w-xs border-r border-ink-900/5 cursor-pointer group ${
            tab.isActive
              ? 'bg-surface border-b-2 border-b-accent-500'
              : 'bg-surface-secondary/30 hover:bg-surface-secondary/50'
          }`}
          onClick={() => onTabClick(tab.id)}
        >
          {/* Tab content */}
          <div className="flex items-center px-3 py-2 min-w-0 flex-1">
            {/* File icon */}
            <span className="mr-2 text-sm flex-shrink-0">
              {getFileIcon(tab.filePath)}
            </span>

            {/* File name */}
            <span className="text-sm truncate flex-1">
              {tab.title}
            </span>

            {/* Dirty indicator */}
            {tab.isDirty && (
              <span className="ml-1 w-2 h-2 bg-accent-500 rounded-full flex-shrink-0" />
            )}
          </div>

          {/* Close button */}
          <button
            className={`p-1 mr-1 rounded hover:bg-surface-secondary transition-colors ${
              tab.isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
            onClick={async (e) => {
              e.stopPropagation();
              if (tab.isDirty) {
                const shouldSave = confirm(`"${tab.title}" has unsaved changes. Save before closing?`);
                if (shouldSave) {
                  try {
                    await onTabSave?.(tab.id);
                    showToast(`Saved ${tab.title}`, 'success');
                  } catch (error) {
                    showToast(`Failed to save ${tab.title}: ${error}`, 'error');
                    return; // Don't close if save failed
                  }
                }
              }
              onTabClose(tab.id);
            }}
            aria-label="Close tab"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* Add tab button */}
      <div className="flex items-center px-2">
        <button
          className="p-1 rounded hover:bg-surface-secondary transition-colors"
          onClick={handleOpenFile}
          aria-label="Open file"
          title="Open file"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function getFileIcon(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    ts: '🟦',
    tsx: '🔵',
    js: '🟨',
    jsx: '🟨',
    py: '🐍',
    rs: '🦀',
    go: '🐹',
    java: '☕',
    cpp: '🔧',
    c: '🔧',
    h: '📋',
    hpp: '📋',
    css: '🎨',
    scss: '🎨',
    html: '🌐',
    xml: '📄',
    json: '📋',
    yaml: '📄',
    yml: '📄',
    md: '📝',
    txt: '📄',
    sh: '⚡',
    bash: '⚡',
    zsh: '⚡',
    sql: '🗄️',
    gitignore: '🚫',
    env: '🔒',
  };

  return iconMap[ext || ''] || '📄';
}