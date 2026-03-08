import { TabKey } from "@/types/daily";

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "claude_ai", label: "Claude.ai" },
  { key: "claude_code", label: "Claude Code" },
  { key: "community", label: "Community" },
  { key: "tips", label: "Tips" },
];

type TabBarProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  storyCounts?: Record<TabKey, number>;
};

export function TabBar({ activeTab, onTabChange, storyCounts }: TabBarProps) {
  return (
    <nav className="sticky top-0 z-10 bg-cream">
      <div className="max-w-3xl mx-auto px-4 flex gap-6 justify-center">
        {TAB_CONFIG.map(({ key, label }) => {
          const count = storyCounts?.[key];
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`py-3 text-sm transition-colors relative cursor-pointer ${
                activeTab === key
                  ? "font-semibold text-charcoal"
                  : "text-gray-secondary hover:text-charcoal"
              }`}
            >
              {label}
              {count !== undefined && (
                <span className="ml-1 text-gray-secondary font-normal">
                  ({count})
                </span>
              )}
              {activeTab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-claude-orange rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
