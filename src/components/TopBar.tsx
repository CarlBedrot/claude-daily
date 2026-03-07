type TopBarProps = {
  date: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
};

export function TopBar({ date, availableDates, onDateChange }: TopBarProps) {
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  return (
    <header className="sticky top-0 z-10 bg-cream border-b border-cream-dark">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal tracking-tight">
            Claude Daily
          </h1>
          <p className="text-sm text-gray-secondary mt-0.5">
            Your daily Claude ecosystem briefing
          </p>
        </div>
        <select
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-white border border-cream-dark rounded-lg px-3 py-1.5 text-sm text-charcoal cursor-pointer hover:border-claude-orange transition-colors"
        >
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
