import { useRef, useEffect } from "react";

interface StreamingTextProps {
  text: string;
  isStreaming: boolean;
  className?: string;
}

/**
 * Simple streaming text with no laggy animations
 */
export function StreamingText({ text, isStreaming, className = "" }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom - instant, no smooth scroll
  useEffect(() => {
    if (containerRef.current && isStreaming) {
      containerRef.current.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [text, isStreaming]);

  if (!text) return null;

  return (
    <div ref={containerRef} className={className}>
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-ink-800 dark:text-ink-100 bg-transparent p-0 m-0">
          {text}
        </pre>
      </div>
    </div>
  );
}
