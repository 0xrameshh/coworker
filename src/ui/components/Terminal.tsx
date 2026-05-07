import { useState } from "react";

interface TerminalProps {
  cwd: string;
  onCommand?: (command: string) => void;
  className?: string;
}

type TerminalLine = {
  id: number;
  text: string;
};

function getCommandOutput(command: string, cwd: string): string[] {
  if (command === "help") {
    return [
      "Available commands:",
      "help - Show available commands",
      "pwd - Print current directory",
      "ls - List files",
      "clear - Clear terminal",
      "echo <text> - Print text",
    ];
  }

  if (command === "pwd") return [cwd];
  if (command === "ls") return ["src/    package.json    README.md    tsconfig.json"];
  if (command.startsWith("echo ")) return [command.slice(5)];
  if (command === "") return [];

  return [`Command not found: ${command}`];
}

export function Terminal({ cwd, onCommand, className = "" }: TerminalProps) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 1, text: "Welcome to Coworker Terminal" },
    { id: 2, text: "Type 'help' for available commands." },
  ]);

  const appendLines = (entries: string[]) => {
    setLines((current) => [
      ...current,
      ...entries.map((text, index) => ({ id: Date.now() + index, text })),
    ]);
  };

  const runCommand = (command: string) => {
    const trimmed = command.trim();
    onCommand?.(trimmed);

    if (trimmed === "clear") {
      setLines([]);
      return;
    }

    appendLines([`${cwd} $ ${trimmed}`, ...getCommandOutput(trimmed, cwd)]);

    if (trimmed) {
      setHistory((current) => [...current, trimmed]);
      setHistoryIndex(null);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runCommand(input);
    setInput("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "ArrowUp" || history.length === 0) return;
    event.preventDefault();

    const nextIndex = historyIndex === null
      ? history.length - 1
      : Math.max(0, historyIndex - 1);
    setHistoryIndex(nextIndex);
    setInput(history[nextIndex]);
  };

  return (
    <div className={`flex h-full flex-col bg-ink-900 text-surface ${className}`}>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-sm">
        {lines.map((line) => (
          <div key={line.id}>{line.text}</div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3 font-mono text-sm">
        <span>{cwd} $</span>
        <input
          className="flex-1 bg-transparent outline-none"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Terminal command"
        />
      </form>
    </div>
  );
}
