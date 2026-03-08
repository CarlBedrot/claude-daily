import { RawItem } from "./types";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (compatible; ClaudeDaily/1.0; +https://github.com/CarlBedrot/claude-daily)",
  Accept: "application/json",
};

const SUBREDDIT_FEEDS = [
  "https://www.reddit.com/r/ClaudeAI/new.json?limit=50",
  "https://www.reddit.com/r/anthropic/new.json?limit=25",
];

const SEARCH_FEEDS = [
  "https://www.reddit.com/r/LocalLLaMA/search.json?q=claude+OR+anthropic+OR+sonnet+OR+opus+OR+haiku&restrict_sr=1&sort=new&t=week&limit=25",
  "https://www.reddit.com/r/ClaudeAI/search.json?q=AnthropicAI+OR+mikeyk+OR+claude_code&restrict_sr=1&sort=new&t=week&limit=15",
];

async function fetchRedditUrl(url: string): Promise<RawItem[]> {
  try {
    const response = await fetch(url, { headers: HEADERS });
    const text = await response.text();

    if (text.startsWith("<") || text.startsWith("<!")) {
      console.error(`Reddit returned HTML for ${url} (likely bot detection)`);
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
    console.error(`Failed to fetch ${url}:`, error);
    return [];
  }
}

export async function fetchReddit(): Promise<RawItem[]> {
  const allUrls = [...SUBREDDIT_FEEDS, ...SEARCH_FEEDS];
  const results = await Promise.all(allUrls.map(fetchRedditUrl));
  return results.flat();
}
