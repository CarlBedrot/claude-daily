"use client";

import { useState } from "react";
import { Story, SourceType } from "@/types/daily";
import { SourceList } from "./SourceList";
import { FootnoteText } from "./FootnoteText";
import { timeAgo } from "@/lib/format";

const SOURCE_LABELS: Record<SourceType, string> = {
  blog: "BLOG",
  reddit: "REDDIT",
  twitter: "X",
  hackernews: "HN",
};

function StoryBody({ story }: { story: Story }) {
  return (
    <>
      <p className="text-sm text-gray-secondary leading-relaxed">
        <FootnoteText text={story.summary} sources={story.sources} />
      </p>

      {story.key_points && story.key_points.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {story.key_points.map((point, i) => (
            <li
              key={i}
              className="text-sm text-charcoal flex items-start gap-2.5"
            >
              <span className="shrink-0 w-5 h-5 rounded-full bg-claude-orange/10 text-claude-orange text-xs font-semibold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <FootnoteText text={point} sources={story.sources} />
            </li>
          ))}
        </ul>
      )}

      {story.perspectives && (
        <p className="mt-3 text-sm italic text-gray-secondary border-l-2 border-claude-orange pl-3">
          <FootnoteText text={story.perspectives} sources={story.sources} />
        </p>
      )}

      <SourceList sources={story.sources} />
    </>
  );
}

type StoryCardProps = {
  story: Story;
  isLead?: boolean;
};

export function StoryCard({ story, isLead = false }: StoryCardProps) {
  const [expanded, setExpanded] = useState(isLead);

  const earliestSource = story.sources.reduce((earliest, s) =>
    s.published_at < earliest.published_at ? s : earliest,
  );

  const sourceLabel = SOURCE_LABELS[earliestSource.type];

  if (isLead) {
    return (
      <article className="border-b border-cream-dark last:border-b-0 bg-cream-dark/30 -mx-4 px-4 rounded-lg">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left py-4 flex items-start justify-between gap-4 group cursor-pointer"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium tracking-wide text-claude-orange">
                {sourceLabel}
              </span>
              <span className="text-xs text-gray-secondary">
                {timeAgo(earliestSource.published_at)}
              </span>
            </div>
            <h2 className="text-lg font-semibold font-serif text-charcoal leading-snug mt-0.5 group-hover:text-claude-orange transition-colors">
              {story.headline}
            </h2>
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            className={`mt-5 shrink-0 text-gray-secondary group-hover:text-claude-orange transition-all duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          >
            <path
              d="M4 6L8 10L12 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </button>

        <div
          className={`overflow-hidden transition-all duration-200 ${
            expanded ? "max-h-[1000px] opacity-100 pb-5" : "max-h-0 opacity-0"
          }`}
        >
          <StoryBody story={story} />
        </div>
      </article>
    );
  }

  return (
    <article className="border-b border-cream-dark last:border-b-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left py-4 flex items-start justify-between gap-4 group cursor-pointer"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide text-claude-orange">
              {sourceLabel}
            </span>
            <span className="text-xs text-gray-secondary">
              {timeAgo(earliestSource.published_at)}
            </span>
          </div>
          <h2 className="text-base font-semibold font-serif text-charcoal leading-snug mt-0.5 group-hover:text-claude-orange transition-colors">
            {story.headline}
          </h2>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          className={`mt-5 shrink-0 text-gray-secondary group-hover:text-claude-orange transition-all duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ${
          expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pb-5 pl-0">
          <StoryBody story={story} />
        </div>
      </div>
    </article>
  );
}
