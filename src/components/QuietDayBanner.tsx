type QuietDayBannerProps = {
  onNavigate: () => void;
  onSwitchTab: () => void;
};

export function QuietDayBanner({
  onNavigate,
  onSwitchTab,
}: QuietDayBannerProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 text-center">
      <p className="text-gray-secondary text-sm">
        Quiet day in the Claude ecosystem.
      </p>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <button
          onClick={onNavigate}
          className="text-claude-orange hover:text-claude-orange-hover cursor-pointer"
        >
          Yesterday&apos;s briefing
        </button>
        <span className="text-gray-secondary">·</span>
        <button
          onClick={onSwitchTab}
          className="text-claude-orange hover:text-claude-orange-hover cursor-pointer"
        >
          Browse tips
        </button>
      </div>
    </div>
  );
}
