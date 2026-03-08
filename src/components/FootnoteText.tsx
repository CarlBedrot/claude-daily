"use client";

import { useState, useRef, useEffect } from "react";
import { Source } from "@/types/daily";
import { extractDomain, faviconUrl, timeAgo } from "@/lib/format";

type FootnoteTextProps = {
  text: string;
  sources: Source[];
  className?: string;
};

export function FootnoteText({ text, sources, className }: FootnoteTextProps) {
  const parts = text.split(/(\[\d+\])/g);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) {
          const sourceIndex = parseInt(match[1], 10) - 1;
          const source = sources[sourceIndex];
          if (!source) return null;
          return (
            <FootnoteMarker key={i} index={sourceIndex + 1} source={source} />
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function FootnoteMarker({ index, source }: { index: number; source: Source }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const markerRef = useRef<HTMLSpanElement>(null);
  const domain = extractDomain(source.url);

  useEffect(() => {
    if (open && markerRef.current) {
      const rect = markerRef.current.getBoundingClientRect();
      setAlignRight(rect.left < 140);
    }
  }, [open]);

  return (
    <span
      ref={markerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-claude-orange hover:text-claude-orange-hover align-super cursor-pointer font-semibold ml-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        [{index}]
      </a>
      {open && (
        <div
          className={`absolute bottom-full mb-2 z-50 w-60 bg-charcoal text-white rounded-lg shadow-lg p-3 text-xs pointer-events-none ${
            alignRight ? "left-0" : "right-0"
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-claude-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
              [{index}]
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={faviconUrl(domain)}
              alt=""
              width={14}
              height={14}
              className="rounded-sm shrink-0"
            />
            <span className="font-medium truncate">{domain}</span>
          </div>
          <p className="text-gray-300 leading-snug line-clamp-2">
            {source.title}
          </p>
          <p className="text-gray-400 mt-1">{timeAgo(source.published_at)}</p>
        </div>
      )}
    </span>
  );
}
