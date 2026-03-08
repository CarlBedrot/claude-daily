"use client";

import { useState } from "react";
import { Story } from "@/types/daily";
import { SourcePill } from "./SourcePill";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "yesterday";
  return `${diffD}d ago`;
}

type StoryCardProps = {
  story: Story;
};

export function StoryCard({ story }: StoryCardProps) {
  const [expanded, setExpanded] = useState(false);

  const earliestSource = story.sources.reduce((earliest, s) =>
    s.published_at < earliest.published_at ? s : earliest,
  );

  const sourceType = story.sources[0]?.type;
  const categoryLabel =
    sourceType === "blog"
      ? "OFFICIAL"
      : sourceType === "reddit"
        ? "COMMUNITY"
        : "UPDATE";

  return (
    <article className="border-b border-cream-dark last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left py-4 flex items-start justify-between gap-4 group cursor-pointer"
      >
        <div className="min-w-0">
          <span className="text-xs font-medium tracking-wide text-claude-orange">
            {categoryLabel}
          </span>
          <h2 className="text-base font-medium text-charcoal leading-snug mt-0.5 group-hover:text-claude-orange transition-colors">
            {story.headline}
          </h2>
        </div>
        <span
          className={`mt-6 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            expanded
              ? "border-claude-orange bg-claude-orange text-white"
              : "border-cream-dark text-transparent"
          }`}
        >
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            className="translate-y-[0.5px]"
          >
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {expanded && (
        <div className="pb-5 pl-0">
          <p className="text-sm text-gray-secondary leading-relaxed">
            {story.summary}
          </p>

          {story.key_points && story.key_points.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {story.key_points.map((point, i) => (
                <li
                  key={i}
                  className="text-sm text-charcoal flex items-start gap-2"
                >
                  <span className="text-claude-orange mt-1 text-xs">●</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}

          {story.perspectives && (
            <p className="mt-3 text-sm italic text-gray-secondary border-l-2 border-claude-orange pl-3">
              {story.perspectives}
            </p>
          )}

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {story.sources.map((source, i) => (
              <SourcePill key={i} type={source.type} url={source.url} />
            ))}
            <span className="text-xs text-gray-secondary ml-auto">
              {timeAgo(earliestSource.published_at)}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
