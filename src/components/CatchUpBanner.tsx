"use client";

type CatchUpBannerProps = {
  missedDates: string[];
  onNavigateToDate: (date: string) => void;
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function CatchUpBanner({
  missedDates,
  onNavigateToDate,
}: CatchUpBannerProps) {
  if (missedDates.length === 0) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 pt-3 pb-1">
      <div className="bg-claude-orange/5 border border-claude-orange/20 rounded-lg px-4 py-3">
        <p className="text-sm font-medium text-charcoal">
          You missed {missedDates.length} day
          {missedDates.length > 1 ? "s" : ""}
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {missedDates.slice(0, 5).map((date) => (
            <button
              key={date}
              onClick={() => onNavigateToDate(date)}
              className="text-xs px-2.5 py-1 rounded-full bg-claude-orange/10 text-claude-orange hover:bg-claude-orange/20 transition-colors cursor-pointer font-medium"
            >
              {formatShortDate(date)}
            </button>
          ))}
          {missedDates.length > 5 && (
            <span className="text-xs text-gray-secondary self-center">
              +{missedDates.length - 5} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
