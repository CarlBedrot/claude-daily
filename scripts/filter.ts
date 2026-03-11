import { RawItem } from "./sources/types";
import { DailyBriefing } from "../src/types/daily";
import fs from "fs";
import path from "path";

/**
 * Collect all source URLs used in recent daily outputs so we never
 * resurface the same story twice.
 */
function getRecentlyUsedUrls(daysBack: number = 3): Set<string> {
  const urls = new Set<string>();
  const dataDir = path.join(process.cwd(), "data");

  for (let i = 1; i <= daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const filePath = path.join(dataDir, `${dateStr}.json`);

    try {
      const data: DailyBriefing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      for (const tab of Object.values(data.tabs)) {
        for (const story of tab.stories ?? []) {
          for (const source of story.sources ?? []) {
            if (source.url) urls.add(source.url);
          }
        }
      }
    } catch {
      // File doesn't exist or is malformed — skip
    }
  }

  return urls;
}

export function filterItems(
  items: RawItem[],
  hoursBack: number = 72,
): RawItem[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursBack);

  const seen = new Set<string>();
  const recentlyUsed = getRecentlyUsedUrls(3);

  return items
    .filter((item) => {
      const publishedAt = new Date(item.published_at);
      if (publishedAt < cutoff) return false;

      if (seen.has(item.url)) return false;
      seen.add(item.url);

      // Skip items already featured in recent daily outputs
      if (recentlyUsed.has(item.url)) return false;

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime(),
    );
}
