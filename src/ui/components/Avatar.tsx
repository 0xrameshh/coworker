import { useMemo } from "react";

export type AvatarType = "initials" | "emoji";

export type AvatarData = {
  type: AvatarType;
  value: string;
};

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  avatar?: AvatarData;
  size?: AvatarSize;
  isAI?: boolean;
  showRing?: boolean;
  className?: string;
}

const sizeClasses: Record<AvatarSize, { container: string; text: string; emoji: string }> = {
  xs: { container: "w-6 h-6", text: "text-[10px]", emoji: "text-sm" },
  sm: { container: "w-8 h-8", text: "text-xs", emoji: "text-base" },
  md: { container: "w-10 h-10", text: "text-sm", emoji: "text-lg" },
  lg: { container: "w-12 h-12", text: "text-base", emoji: "text-xl" },
  xl: { container: "w-16 h-16", text: "text-lg", emoji: "text-2xl" },
};

// Generate initials from name
function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Generate a consistent color based on name
function getColorFromName(name: string, isAI: boolean): string {
  if (isAI) {
    // AI gets accent color
    return "bg-accent-500 text-white";
  }

  // User colors based on name hash
  const colors = [
    "bg-blue-500 text-white",
    "bg-emerald-500 text-white",
    "bg-violet-500 text-white",
    "bg-amber-500 text-white",
    "bg-rose-500 text-white",
    "bg-cyan-500 text-white",
    "bg-indigo-500 text-white",
    "bg-teal-500 text-white",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  name,
  avatar,
  size = "md",
  isAI = false,
  showRing = false,
  className = "",
}: AvatarProps) {
  const sizeClass = sizeClasses[size];

  const initials = useMemo(() => getInitials(name), [name]);
  const colorClass = useMemo(() => getColorFromName(name, isAI), [name, isAI]);

  const ringClass = showRing
    ? "ring-2 ring-accent-500 ring-offset-2 ring-offset-surface"
    : "";

  // Emoji avatar
  if (avatar?.type === "emoji" && avatar.value) {
    return (
      <div
        className={`${sizeClass.container} rounded-full flex items-center justify-center flex-shrink-0 bg-surface-secondary ${ringClass} ${className}`}
      >
        <span className={sizeClass.emoji}>{avatar.value}</span>
      </div>
    );
  }

  // Initials avatar (default)
  return (
    <div
      className={`${sizeClass.container} rounded-full flex items-center justify-center flex-shrink-0 ${colorClass} ${ringClass} ${className}`}
    >
      <span className={`${sizeClass.text} font-semibold`}>{initials}</span>
    </div>
  );
}

// Preset emoji options for avatar picker
export const avatarEmojis = [
  "🤖", "🧠", "⚡", "🔮", "🎯", "💡", "🚀", "✨",
  "🌟", "🎨", "🔥", "💎", "🌈", "🎭", "🦊", "🐱",
  "🐶", "🦁", "🐼", "🦄", "👤", "👻", "🎃", "🌸",
];

// Avatar picker component for settings
interface AvatarPickerProps {
  currentAvatar?: AvatarData;
  name: string;
  isAI?: boolean;
  onChange: (avatar: AvatarData) => void;
}

export function AvatarPicker({
  currentAvatar,
  name,
  isAI = false,
  onChange,
}: AvatarPickerProps) {
  return (
    <div className="space-y-3">
      {/* Current avatar preview */}
      <div className="flex items-center gap-3">
        <Avatar name={name} avatar={currentAvatar} size="lg" isAI={isAI} />
        <div className="flex-1">
          <p className="text-sm font-medium text-ink-700">
            {currentAvatar?.type === "initials" && "Auto-generated initials"}
            {currentAvatar?.type === "emoji" && "Emoji avatar"}
            {!currentAvatar && "Default avatar"}
          </p>
          <p className="text-xs text-muted">Click below to change</p>
        </div>
      </div>

      {/* Avatar type tabs */}
      <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg">
        <button
          type="button"
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            (!currentAvatar || currentAvatar.type === "initials")
              ? "bg-surface text-ink-800 shadow-sm"
              : "text-muted hover:text-ink-700"
          }`}
          onClick={() => onChange({ type: "initials", value: "" })}
        >
          Initials
        </button>
        <button
          type="button"
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            currentAvatar?.type === "emoji"
              ? "bg-surface text-ink-800 shadow-sm"
              : "text-muted hover:text-ink-700"
          }`}
          onClick={() => onChange({ type: "emoji", value: avatarEmojis[0] })}
        >
          Emoji
        </button>
      </div>

      {/* Emoji grid (shown when emoji selected) */}
      {currentAvatar?.type === "emoji" && (
        <div className="grid grid-cols-8 gap-1.5 p-2 bg-surface-secondary rounded-lg">
          {avatarEmojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={`w-8 h-8 flex items-center justify-center rounded-md text-lg transition-all hover:bg-surface hover:scale-110 ${
                currentAvatar.value === emoji
                  ? "bg-accent-500/20 ring-2 ring-accent-500"
                  : ""
              }`}
              onClick={() => onChange({ type: "emoji", value: emoji })}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
