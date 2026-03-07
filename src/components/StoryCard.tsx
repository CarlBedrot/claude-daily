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
  const earliestSource = story.sources.reduce((earliest, s) =>
    s.published_at < earliest.published_at ? s : earliest,
  );

  return (
    <article className="py-5 border-b border-cream-dark last:border-b-0">
      <h2 className="text-base font-semibold text-charcoal leading-snug">
        {story.headline}
      </h2>

      <p className="mt-2 text-sm text-gray-secondary leading-relaxed">
        {story.summary}
      </p>

      {story.key_points && story.key_points.length > 0 && (
        <ul className="mt-2.5 space-y-1">
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
        <p className="mt-2.5 text-sm italic text-gray-secondary border-l-2 border-claude-orange pl-3">
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
    </article>
  );
}
