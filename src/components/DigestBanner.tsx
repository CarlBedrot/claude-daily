type DigestBannerProps = { digest: string };

export function DigestBanner({ digest }: DigestBannerProps) {
  return (
    <div className="max-w-3xl mx-auto px-4 pt-4 pb-2">
      <p className="text-sm text-gray-secondary leading-relaxed font-serif italic border-l-2 border-claude-orange pl-4">
        {digest}
      </p>
    </div>
  );
}
