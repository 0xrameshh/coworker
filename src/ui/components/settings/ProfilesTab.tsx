import { Avatar, AvatarPicker, type AvatarData } from "../Avatar";
import type { Profile, AiProfileData } from "../../store/useAppStore";

interface ProfilesTabProps {
  userProfile: Profile;
  aiProfile: AiProfileData;
  onUserAvatarChange: (avatar: AvatarData) => void;
  onAiAvatarChange: (avatar: AvatarData) => void;
  onUserNameChange: (name: string) => void;
  onAiNameChange: (name: string) => void;
  onAiPersonalityChange: (personality: "professional" | "casual" | "technical" | "creative") => void;
}

export function ProfilesTab({
  userProfile,
  aiProfile,
  onUserAvatarChange,
  onAiAvatarChange,
  onUserNameChange,
  onAiNameChange,
  onAiPersonalityChange,
}: ProfilesTabProps) {
  return (
    <div className="space-y-8">
      {/* User Profile */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <label className="text-xs font-medium text-muted uppercase tracking-wider">Your Profile</label>
        </div>

        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface-secondary/50 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar
              name={userProfile.name || "You"}
              avatar={userProfile.avatar}
              size="xl"
            />
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs text-muted">Display Name</label>
                <input
                  type="text"
                  className="w-full mt-1 rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                  placeholder="Your Name"
                  value={userProfile.name}
                  onChange={(e) => onUserNameChange(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-ink-900/10">
            <label className="text-xs text-muted">Avatar</label>
            <div className="mt-2">
              <AvatarPicker
                currentAvatar={userProfile.avatar}
                name={userProfile.name || "You"}
                onChange={onUserAvatarChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* AI Profile */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
          <label className="text-xs font-medium text-muted uppercase tracking-wider">AI Assistant</label>
        </div>

        <div className="p-4 rounded-xl border border-ink-900/10 bg-surface-secondary/50 space-y-4">
          <div className="flex items-start gap-4">
            <Avatar
              name={aiProfile.name || "Coworker"}
              avatar={aiProfile.avatar}
              size="xl"
              isAI
            />
            <div className="flex-1 space-y-3">
              <div>
                <label className="text-xs text-muted">Assistant Name</label>
                <input
                  type="text"
                  className="w-full mt-1 rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                  placeholder="AI Name"
                  value={aiProfile.name}
                  onChange={(e) => onAiNameChange(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted">Personality</label>
                <select
                  className="w-full mt-1 rounded-lg border border-ink-900/10 bg-surface px-3 py-2 text-sm text-ink-800 focus:border-accent-500 focus:outline-none"
                  value={aiProfile.personality || "professional"}
                  onChange={(e) => onAiPersonalityChange(e.target.value as "professional" | "casual" | "technical" | "creative")}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual & Friendly</option>
                  <option value="technical">Technical & Precise</option>
                  <option value="creative">Creative & Playful</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-ink-900/10">
            <label className="text-xs text-muted">Avatar</label>
            <div className="mt-2">
              <AvatarPicker
                currentAvatar={aiProfile.avatar}
                name={aiProfile.name || "Coworker"}
                isAI
                onChange={onAiAvatarChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
