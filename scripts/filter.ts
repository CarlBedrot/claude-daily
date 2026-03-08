import { RawItem } from "./sources/types";

export function filterItems(
  items: RawItem[],
  hoursBack: number = 72,
): RawItem[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursBack);

  const seen = new Set<string>();

  return items
    .filter((item) => {
      const publishedAt = new Date(item.published_at);
      if (publishedAt < cutoff) return false;

      if (seen.has(item.url)) return false;
      seen.add(item.url);

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
}
