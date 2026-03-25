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
  unreadCounts?: Record<TabKey, number>;
};

export function TabBar({
  activeTab,
  onTabChange,
  storyCounts,
  unreadCounts,
}: TabBarProps) {
  return (
    <nav className="sticky top-0 z-10 bg-cream">
      <div className="max-w-3xl mx-auto px-4 flex gap-6 justify-center">
        {TAB_CONFIG.map(({ key, label }) => {
          const count = storyCounts?.[key];
          const unread = unreadCounts?.[key] ?? 0;
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
              {unread > 0 && activeTab !== key && (
                <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-claude-orange text-white rounded-full">
                  {unread > 9 ? "9+" : unread}
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
