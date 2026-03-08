import { RawItem } from "./types";
import fs from "fs";
import path from "path";

export type TipSource = {
  url: string;
  author: { name: string; role: string };
};

export const TIP_REGISTRY: TipSource[] = [
  {
    url: "https://www.reddit.com/r/ClaudeAI/search.json?q=tip+OR+trick+OR+workflow+claude+code&restrict_sr=1&sort=top&t=month&limit=10",
    author: { name: "Community", role: "r/ClaudeAI contributors" },
  },
];

type StoredTip = {
  id: string;
  sources: { url: string }[];
};

export function getExistingSourceUrls(): Set<string> {
  try {
    const tipsPath = path.join(process.cwd(), "data", "tips.json");
    const data = JSON.parse(fs.readFileSync(tipsPath, "utf-8"));
    const tips: StoredTip[] = data.tips ?? [];
    return new Set(tips.flatMap((t) => t.sources.map((s) => s.url)));
  } catch {
    return new Set();
  }
}

export async function fetchTipSources(): Promise<
  { item: RawItem; author: { name: string; role: string } }[]
> {
  const existingUrls = getExistingSourceUrls();
  const results: { item: RawItem; author: { name: string; role: string } }[] =
    [];

  // Fetch Reddit tip search
  try {
    const redditEntry = TIP_REGISTRY[0];
    const response = await fetch(redditEntry.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClaudeDaily/1.0; +https://github.com/CarlBedrot/claude-daily)",
        Accept: "application/json",
      },
    });

    const text = await response.text();
    if (!text.startsWith("<") && !text.startsWith("<!")) {
      const data = JSON.parse(text);
      for (const child of data.data.children) {
        const post = child.data;
        const url = `https://reddit.com${post.permalink}`;
        if (existingUrls.has(url) || post.score < 5) continue;

        results.push({
          item: {
            title: post.title,
            url,
            content: post.selftext || post.title,
            source_type: "reddit" as const,
            published_at: new Date(post.created_utc * 1000).toISOString(),
            score: post.score,
          },
          author: redditEntry.author,
        });
      }
    }
  } catch (error) {
    console.error("Failed to fetch Reddit tips:", error);
  }

  return results;
}
