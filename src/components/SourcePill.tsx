import { SourceType } from "@/types/daily";

const SOURCE_CONFIG: Record<SourceType, { label: string; icon: string }> = {
  blog: { label: "Blog", icon: "📝" },
  reddit: { label: "Reddit", icon: "💬" },
  twitter: { label: "X", icon: "𝕏" },
};

type SourcePillProps = {
  type: SourceType;
  url: string;
};

export function SourcePill({ type, url }: SourcePillProps) {
  const config = SOURCE_CONFIG[type];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cream-dark text-gray-secondary hover:text-claude-orange hover:bg-cream transition-colors"
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </a>
  );
}
