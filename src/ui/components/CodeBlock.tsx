import { useState, useCallback, useEffect } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
}

const LANGUAGE_NAMES: Record<string, string> = {
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  py: "Python",
  rb: "Ruby",
  rs: "Rust",
  go: "Go",
  java: "Java",
  c: "C",
  cpp: "C++",
  cs: "C#",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  scala: "Scala",
  html: "HTML",
  css: "CSS",
  scss: "SCSS",
  json: "JSON",
  yaml: "YAML",
  md: "Markdown",
  sh: "Shell",
  bash: "Bash",
  zsh: "Zsh",
  sql: "SQL",
  dockerfile: "Dockerfile",
  xml: "XML",
  lua: "Lua",
  r: "R",
  vim: "Vim",
  toml: "TOML",
  ini: "INI",
  conf: "Config",
  makefile: "Makefile",
  cmake: "CMake",
  gradle: "Gradle",
  plaintext: "Plain Text",
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  rust: "Rust",
};

function getLanguageName(lang: string | undefined): string {
  if (!lang) return "Code";
  return LANGUAGE_NAMES[lang.toLowerCase()] || lang.toUpperCase();
}

// Detect if we're in dark mode
const isDarkMode = () => document.documentElement.classList.contains('dark');

export function CodeBlock({
  code,
  language = "plaintext",
  showLineNumbers = false,
  filename,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [darkMode, setDarkMode] = useState(isDarkMode());

  // Update dark mode state when theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(isDarkMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy code:", error);
    }
  }, [code]);

  const codeTheme = darkMode ? oneDark : oneLight;

  // Determine if code is long enough to be collapsible
  const lines = code.split("\n");
  const isLongCode = lines.length > 8;
  const shouldShowCollapse = isLongCode;
  const displayExpanded = isExpanded || !isLongCode;

  return (
    <div className="rounded-xl overflow-hidden border border-ink-900/10 bg-surface-tertiary dark:bg-[#0D1117] my-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-secondary dark:bg-[#161B22] border-b border-ink-900/10">
        <div className="flex items-center gap-3">
          {/* Language badge */}
          <span className="px-2 py-0.5 rounded-md bg-accent-500/10 text-accent-600 dark:text-accent-400 text-xs font-semibold">
            {getLanguageName(language)}
          </span>
          {/* Filename if provided */}
          {filename && (
            <span className="text-xs text-ink-500 dark:text-ink-400 font-mono">
              {filename.split("/").pop()}
            </span>
          )}
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 hover:bg-surface-tertiary dark:hover:bg-ink-900/30 transition-all"
            title="Copy code"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-success" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-success font-medium">Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
          {/* Fold/Unfold button */}
          {shouldShowCollapse && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-ink-500 hover:text-ink-700 dark:text-ink-400 dark:hover:text-ink-200 hover:bg-surface-tertiary dark:hover:bg-ink-900/30 transition-all"
              title={displayExpanded ? "Collapse" : "Expand"}
            >
              {displayExpanded ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18,15 12,9 6,15" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div className={`overflow-x-auto ${!displayExpanded ? 'max-h-[200px]' : ''}`}>
        <SyntaxHighlighter
          language={language === 'plaintext' ? 'text' : language}
          style={codeTheme}
          showLineNumbers={showLineNumbers}
          customStyle={{
            margin: 0,
            padding: '16px',
            background: 'transparent',
            fontSize: '13px',
            lineHeight: '1.6',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace",
          }}
          codeTagProps={{
            style: {
              fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', monospace",
            }
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>

      {/* Expand hint footer */}
      {shouldShowCollapse && !displayExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          className="px-4 py-2 bg-surface-secondary dark:bg-[#161B22] border-t border-ink-900/10 text-center cursor-pointer hover:bg-surface-tertiary dark:hover:bg-ink-900/20 transition-colors"
        >
          <span className="text-xs text-accent-600 dark:text-accent-400 font-medium">
            +{lines.length - 8} more lines - click to expand
          </span>
        </div>
      )}
    </div>
  );
}

// Simplified inline code component
export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 rounded-md bg-surface-tertiary text-accent-700 dark:text-accent-300 text-sm font-mono border border-ink-900/5">
      {children}
    </code>
  );
}
