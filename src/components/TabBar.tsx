import { TabKey } from "@/types/daily";

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "claude_ai", label: "Claude.ai" },
  { key: "claude_code", label: "Claude Code" },
  { key: "cowork", label: "Cowork" },
];

type TabBarProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  storyCounts: Record<TabKey, number>;
};

export function TabBar({ activeTab, onTabChange, storyCounts }: TabBarProps) {
  return (
    <nav className="sticky top-[73px] z-10 bg-cream border-b border-cream-dark">
      <div className="max-w-3xl mx-auto px-4 flex gap-0">
        {TAB_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === key
                ? "text-claude-orange"
                : "text-gray-secondary hover:text-charcoal"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-gray-secondary">
              {storyCounts[key]}
            </span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-claude-orange" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
