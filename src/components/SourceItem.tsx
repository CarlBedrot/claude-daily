import { Source } from "@/types/daily";
import { extractDomain, faviconUrl, timeAgo } from "@/lib/format";

type SourceItemProps = {
  source: Source;
};

export function SourceItem({ source }: SourceItemProps) {
  const domain = extractDomain(source.url);

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2.5 py-1.5 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl(domain)}
        alt=""
        width={16}
        height={16}
        className="shrink-0 rounded-sm"
      />
      <div className="min-w-0 flex-1 flex items-baseline gap-2">
        <span className="text-sm font-medium text-charcoal group-hover:text-claude-orange transition-colors shrink-0">
          {domain}
        </span>
        <span className="text-sm text-gray-secondary truncate">
          {source.title}
        </span>
      </div>
      <span className="text-xs text-gray-secondary shrink-0">
        {timeAgo(source.published_at)}
      </span>
    </a>
  );
}
