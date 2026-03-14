import { Digest } from "@/types/daily";

type DigestBannerProps = { digest: string | Digest };

export function DigestBanner({ digest }: DigestBannerProps) {
  if (typeof digest === "string") {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
        <p className="text-sm text-gray-secondary leading-relaxed font-serif italic border-l-2 border-claude-orange pl-4">
          {digest}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-2 space-y-2">
      <p className="text-sm text-charcoal leading-relaxed font-serif border-l-2 border-claude-orange pl-4">
        {digest.lead}
      </p>
      {digest.themes.length > 0 && (
        <div className="flex gap-2 pl-4">
          {digest.themes.map((theme) => (
            <span
              key={theme}
              className="text-xs px-2 py-0.5 rounded-full bg-claude-orange/10 text-claude-orange font-medium"
            >
              {theme}
            </span>
          ))}
        </div>
      )}
      {digest.summary && (
        <p className="text-sm text-gray-secondary leading-relaxed font-serif italic pl-4">
          {digest.summary}
        </p>
      )}
    </div>
  );
}
