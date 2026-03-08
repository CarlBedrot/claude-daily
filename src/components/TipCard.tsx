import { Story } from "@/types/daily";
import { SourceList } from "./SourceList";
import { FootnoteText } from "./FootnoteText";

type TipCardProps = {
  story: Story;
};

export function TipCard({ story }: TipCardProps) {
  return (
    <article className="border-b border-cream-dark last:border-b-0 py-5">
      {story.author && (
        <div className="text-xs mb-1.5">
          <span className="font-semibold text-charcoal">
            {story.author.name}
          </span>
          <span className="text-gray-secondary"> · {story.author.role}</span>
        </div>
      )}

      <h2 className="text-lg font-semibold font-serif text-charcoal leading-snug">
        {story.headline}
      </h2>

      <p className="mt-2 text-sm text-gray-secondary leading-relaxed">
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
    </article>
  );
}
