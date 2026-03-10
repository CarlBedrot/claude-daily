"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SearchResult } from "@/lib/data";

type SearchOverlayProps = {
  onClose: () => void;
};

export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleResultClick = (date: string) => {
    router.push(`/?date=${date}`);
    onClose();
  };

  const formatDate = (date: string) => {
    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const highlightMatch = (text: string) => {
    if (!query) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark
          key={i}
          className="bg-claude-orange/20 text-charcoal rounded px-0.5"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 bg-charcoal/50 flex items-start justify-center pt-[15vh]"
    >
      <div className="bg-cream rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[60vh] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-dark">
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            className="text-gray-secondary shrink-0"
          >
            <circle
              cx="7.5"
              cy="7.5"
              r="5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M11.5 11.5L16 16"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past briefings..."
            className="flex-1 bg-transparent text-charcoal placeholder:text-gray-secondary outline-none text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-gray-secondary hover:text-charcoal text-xs cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <p className="px-4 py-8 text-center text-sm text-gray-secondary">
              Searching...
            </p>
          )}

          {!loading && searched && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-secondary">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {!loading &&
            results.map((result, i) => (
              <button
                key={`${result.date}-${result.story.id}-${i}`}
                onClick={() => handleResultClick(result.date)}
                className="w-full text-left px-4 py-3 border-b border-cream-dark hover:bg-cream-dark/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-claude-orange bg-claude-orange/10 px-1.5 py-0.5 rounded">
                    {formatDate(result.date)}
                  </span>
                  <span className="text-[10px] text-gray-secondary">
                    {result.tabLabel}
                  </span>
                </div>
                <h3 className="text-sm font-semibold font-serif text-charcoal leading-snug">
                  {highlightMatch(result.story.headline)}
                </h3>
                <p className="text-xs text-gray-secondary mt-0.5 line-clamp-2 leading-relaxed">
                  {highlightMatch(result.matchContext)}
                </p>
              </button>
            ))}

          {!loading && !searched && (
            <p className="px-4 py-8 text-center text-sm text-gray-secondary">
              Type to search across all briefings
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
