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
        <button
          onClick={() => {
            const select = document.getElementById("date-select");
            if (select) (select as HTMLSelectElement).showPicker();
          }}
          className="text-sm text-gray-secondary mt-1 hover:text-claude-orange transition-colors cursor-pointer"
        >
          {formattedDate}
        </button>
        <select
          id="date-select"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="sr-only"
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
