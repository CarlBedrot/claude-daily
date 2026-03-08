import { RawItem } from "./types";

const USER_AGENT =
  "ClaudeDaily/1.0 (by /u/ClaudeDaily; +https://github.com/CarlBedrot/claude-daily)";

const SUBREDDIT_FEEDS = [
  "/r/ClaudeAI/new?limit=50",
  "/r/anthropic/new?limit=25",
];

const SEARCH_FEEDS = [
  "/r/LocalLLaMA/search?q=claude+OR+anthropic+OR+sonnet+OR+opus+OR+haiku&restrict_sr=1&sort=new&t=week&limit=25",
  "/r/ClaudeAI/search?q=AnthropicAI+OR+mikeyk+OR+claude_code&restrict_sr=1&sort=new&t=week&limit=15",
];

async function getOAuthToken(): Promise<string | null> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token ?? null;
}

async function fetchRedditUrl(
  path: string,
  token: string | null,
): Promise<RawItem[]> {
  const baseUrl = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
  const suffix = token ? "" : ".json";
  const url = `${baseUrl}${path}${suffix}`;

  try {
    const headers: Record<string, string> = {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });
    const text = await response.text();

    if (text.startsWith("<") || text.startsWith("<!")) {
      console.error(`Reddit returned HTML for ${path} (bot detection)`);
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
    console.error(`Failed to fetch ${path}:`, error);
    return [];
  }
}

export async function fetchReddit(): Promise<RawItem[]> {
  const token = await getOAuthToken();
  if (token) {
    console.log("  Using Reddit OAuth API");
  } else {
    console.log(
      "  Using Reddit public API (set REDDIT_CLIENT_ID/SECRET for CI)",
    );
  }

  const allPaths = [...SUBREDDIT_FEEDS, ...SEARCH_FEEDS];
  const results = await Promise.all(
    allPaths.map((path) => fetchRedditUrl(path, token)),
  );
  return results.flat();
}
