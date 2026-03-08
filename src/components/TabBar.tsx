import { TabKey } from "@/types/daily";

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "claude_ai", label: "Claude.ai" },
  { key: "claude_code", label: "Claude Code" },
  { key: "cowork", label: "Cowork" },
];

type TabBarProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
};

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="sticky top-0 z-10 bg-cream">
      <div className="max-w-3xl mx-auto px-4 flex gap-6 justify-center">
        {TAB_CONFIG.map(({ key, label }) => (
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
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-claude-orange rounded-full" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
