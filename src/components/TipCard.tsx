"use client";

import { useState } from "react";
import { Story } from "@/types/daily";
import { SourceList } from "./SourceList";
import { FootnoteText } from "./FootnoteText";

const DIFFICULTY_STYLES = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-amber-100 text-amber-700",
  advanced: "bg-red-100 text-red-700",
} as const;

type TipCardProps = {
  story: Story;
  isLead?: boolean;
};

function TipMeta({ story }: { story: Story }) {
  if (!story.difficulty && !story.estimated_minutes) return null;
  return (
    <div className="flex items-center gap-2 mt-1">
      {story.difficulty && (
        <span
          className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${DIFFICULTY_STYLES[story.difficulty]}`}
        >
          {story.difficulty}
        </span>
      )}
      {story.estimated_minutes && (
        <span className="text-xs text-gray-secondary">
          ~{story.estimated_minutes} min
        </span>
      )}
    </div>
  );
}

function TipBody({ story }: { story: Story }) {
  return (
    <>
      <p className="text-sm text-gray-secondary leading-relaxed">
        <FootnoteText text={story.summary} sources={story.sources} />
      </p>

      {story.actionable_steps && story.actionable_steps.length > 0 && (
        <div className="mt-3 border-l-2 border-claude-orange pl-3">
          <ul className="space-y-1">
            {story.actionable_steps.map((step, i) => (
              <li
                key={i}
                className="text-sm text-charcoal flex items-start gap-2"
              >
                <span className="shrink-0 text-claude-orange mt-0.5">→</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <SourceList sources={story.sources} />
    </>
  );
}

export function TipCard({ story, isLead = false }: TipCardProps) {
  const [expanded, setExpanded] = useState(isLead);

  if (isLead) {
    return (
      <article className="border-b border-cream-dark last:border-b-0 bg-cream-dark/30 -mx-4 px-4 rounded-lg">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left py-4 flex items-start justify-between gap-4 group cursor-pointer"
        >
          <div className="min-w-0">
            {story.author && (
              <div className="text-xs mb-0.5">
                <span className="font-semibold text-charcoal">
                  {story.author.name}
                </span>
                <span className="text-gray-secondary">
                  {" "}
                  · {story.author.role}
                </span>
              </div>
            )}
            <h2 className="text-lg font-semibold font-serif text-charcoal leading-snug group-hover:text-claude-orange transition-colors">
              {story.headline}
            </h2>
            <TipMeta story={story} />
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
          <TipBody story={story} />
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
          {story.author && (
            <div className="text-xs mb-0.5">
              <span className="font-semibold text-charcoal">
                {story.author.name}
              </span>
              <span className="text-gray-secondary">
                {" "}
                · {story.author.role}
              </span>
            </div>
          )}
          <h2 className="text-base font-semibold font-serif text-charcoal leading-snug group-hover:text-claude-orange transition-colors">
            {story.headline}
          </h2>
          <TipMeta story={story} />
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
          <TipBody story={story} />
        </div>
      </div>
    </article>
  );
}
