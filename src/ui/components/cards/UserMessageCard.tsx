import { memo, useState, useCallback } from "react";
import { useAppStore } from "../../store/useAppStore";
import { Avatar } from "../Avatar";

interface UserMessageCardProps {
  message: { type: "user_prompt"; prompt: string; images?: string[] };
}

export const UserMessageCard = memo(function UserMessageCard({ message }: UserMessageCardProps) {
  const userProfile = useAppStore(s => s.userProfile);
  const [copied, setCopied] = useState(false);
  const [showCopy, setShowCopy] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, [message.prompt]);

  return (
    <div
      className="flex items-start gap-3 mt-10 mb-4 group justify-end"
      onMouseEnter={() => setShowCopy(true)}
      onMouseLeave={() => setShowCopy(false)}
    >
      {/* Message content */}
      <div className="flex flex-col items-end max-w-[85%]">
        {/* Copy button */}
        <div className="flex items-center gap-2 mb-1 px-1">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
              copied
                ? 'bg-success/10 text-success'
                : 'text-ink-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-500/10'
            } ${showCopy ? 'opacity-100' : 'opacity-0'}`}
            title="Copy message"
          >
            {copied ? (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            )}
          </button>
        </div>

        {/* Message bubble */}
        <div className="bg-surface-tertiary rounded-2xl rounded-tr-sm px-5 py-3 shadow-sm border border-ink-900/10">
          {/* Image attachments */}
          {message.images && message.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Attachment ${index + 1}`}
                    className="max-w-[200px] max-h-[200px] rounded-lg object-contain border border-ink-900/10 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      // Open image in new window for full view
                      const win = window.open();
                      if (win) {
                        win.document.write(`<img src="${image}" style="max-width:100%;height:auto;" />`);
                      }
                    }}
                    title="Click to view full size"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Text message */}
          {message.prompt && (
            <p className="text-ink-800 text-[15px] font-medium leading-relaxed whitespace-pre-wrap break-words">
              {message.prompt}
            </p>
          )}
        </div>

        {/* User name */}
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-[11px] font-semibold text-accent-600 dark:text-accent-400 uppercase tracking-wide">
            {userProfile.name || "You"}
          </span>
        </div>
      </div>

      {/* User Avatar */}
      <Avatar
        name={userProfile.name || "You"}
        avatar={userProfile.avatar}
        size="sm"
        className="flex-shrink-0 mt-6"
      />
    </div>
  );
});
