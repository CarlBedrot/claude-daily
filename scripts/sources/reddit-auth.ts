import { RawItem } from "./types";

export const REDDIT_USER_AGENT =
  "ClaudeDaily/1.0 (by /u/ClaudeDaily; +https://github.com/CarlBedrot/claude-daily)";

let cachedToken: string | null = null;
let tokenFetched = false;

export async function getRedditOAuthToken(): Promise<string | null> {
  if (tokenFetched) return cachedToken;

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    tokenFetched = true;
    return null;
  }

  try {
    const response = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "User-Agent": REDDIT_USER_AGENT,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();
    cachedToken = data.access_token ?? null;
  } catch (error) {
    console.error("Reddit OAuth failed:", error);
    cachedToken = null;
  }

  tokenFetched = true;
  return cachedToken;
}

export async function fetchRedditUrl(
  path: string,
  token: string | null,
): Promise<RawItem[]> {
  const baseUrl = token ? "https://oauth.reddit.com" : "https://www.reddit.com";
  let url: string;
  if (token) {
    url = `${baseUrl}${path}`;
  } else {
    const [pathPart, query] = path.split("?");
    url = `${baseUrl}${pathPart}.json${query ? `?${query}` : ""}`;
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": REDDIT_USER_AGENT,
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
