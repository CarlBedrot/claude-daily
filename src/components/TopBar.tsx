"use client";

import { useState, useEffect } from "react";
import { SearchOverlay } from "./SearchOverlay";

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

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 2v2M9 14v2M2 9h2M14 9h2M4.2 4.2l1.4 1.4M12.4 12.4l1.4 1.4M13.8 4.2l-1.4 1.4M5.6 12.4l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M15.1 10.4A6.5 6.5 0 017.6 2.9a7 7 0 107.5 7.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return { dark, toggle };
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M11.5 11.5L16 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TopBar({ date, availableDates, onDateChange }: TopBarProps) {
  const currentIndex = availableDates.indexOf(date);
  const hasNewer = currentIndex > 0;
  const hasOlder = currentIndex < availableDates.length - 1;
  const { dark, toggle } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);

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
      <div className="max-w-3xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-cream-dark hover:text-claude-orange text-gray-secondary"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          <h1 className="text-lg font-bold font-serif text-charcoal tracking-tight">
            Claude Daily
          </h1>
          <button
            onClick={toggle}
            className="p-1.5 rounded-full transition-colors cursor-pointer hover:bg-cream-dark hover:text-claude-orange text-gray-secondary"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
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
          <span className="text-sm text-gray-secondary min-w-[180px] text-center">
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
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </header>
  );
}
