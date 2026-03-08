import { RawItem } from "./types";

const SUBREDDIT_URL = "https://www.reddit.com/r/ClaudeAI/new.json?limit=50";

export async function fetchReddit(): Promise<RawItem[]> {
  try {
    const response = await fetch(SUBREDDIT_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClaudeDaily/1.0; +https://github.com/CarlBedrot/claude-daily)",
        Accept: "application/json",
      },
    });

    const text = await response.text();

    // Reddit sometimes returns HTML instead of JSON (bot detection)
    if (text.startsWith("<") || text.startsWith("<!")) {
      console.error(
        "Reddit returned HTML instead of JSON (likely bot detection)",
      );
      return [];
    }

    const data = JSON.parse(text);

    return data.data.children
      .filter((child: any) => child.data.score > 0)
      .map((child: any) => ({
        title: child.data.title,
        url: `https://reddit.com${child.data.permalink}`,
        content: child.data.selftext || child.data.title,
        source_type: "reddit" as const,
        published_at: new Date(child.data.created_utc * 1000).toISOString(),
        score: child.data.score,
      }));
  } catch (error) {
    console.error("Failed to fetch Reddit:", error);
    return [];
  }
}
