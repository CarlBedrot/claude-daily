"use client";

import { useState } from "react";
import { Source } from "@/types/daily";
import { SourceItem } from "./SourceItem";

type SourceListProps = {
  sources: Source[];
};

export function SourceList({ sources }: SourceListProps) {
  const [open, setOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-secondary hover:text-charcoal transition-colors cursor-pointer"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          <path
            d="M4.5 2.5L8 6L4.5 9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        Sources ({sources.length})
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-96 opacity-100 mt-1.5" : "max-h-0 opacity-0"}`}
      >
        <div className="border-l-2 border-cream-dark pl-3">
          {sources.map((source, i) => (
            <SourceItem key={i} source={source} />
          ))}
        </div>
      </div>
    </div>
  );
}
