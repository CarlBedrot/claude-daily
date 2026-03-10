"use client";

type TopBarProps = {
  date: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
};

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
    >
      <path
        d="M11 4L6 9L11 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      className={className}
    >
      <path
        d="M7 4L12 9L7 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TopBar({ date, availableDates, onDateChange }: TopBarProps) {
  const currentIndex = availableDates.indexOf(date);
  const hasNewer = currentIndex > 0;
  const hasOlder = currentIndex < availableDates.length - 1;

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <header className="bg-cream">
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2 text-center">
        <h1 className="text-lg font-bold font-serif text-charcoal tracking-tight">
          Claude Daily
        </h1>
        <div className="flex items-center justify-center gap-3 mt-1">
          <button
            onClick={() =>
              hasOlder && onDateChange(availableDates[currentIndex + 1])
            }
            disabled={!hasOlder}
            className="p-1.5 rounded-full transition-colors cursor-pointer enabled:hover:bg-cream-dark enabled:hover:text-claude-orange disabled:opacity-20 disabled:cursor-default text-gray-secondary"
            aria-label="Older"
          >
            <ChevronLeft />
          </button>
          <span className="text-sm text-gray-secondary min-w-[180px]">
            {formattedDate}
          </span>
          <button
            onClick={() =>
              hasNewer && onDateChange(availableDates[currentIndex - 1])
            }
            disabled={!hasNewer}
            className="p-1.5 rounded-full transition-colors cursor-pointer enabled:hover:bg-cream-dark enabled:hover:text-claude-orange disabled:opacity-20 disabled:cursor-default text-gray-secondary"
            aria-label="Newer"
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </header>
  );
}
