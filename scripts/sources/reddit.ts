import { RawItem } from "./types";
import { getRedditOAuthToken, fetchRedditUrl } from "./reddit-auth";

const SUBREDDIT_FEEDS = [
  "/r/ClaudeAI/new?limit=50",
  "/r/anthropic/new?limit=25",
];

const SEARCH_FEEDS = [
  "/r/LocalLLaMA/search?q=claude+OR+anthropic+OR+sonnet+OR+opus+OR+haiku&restrict_sr=1&sort=new&t=week&limit=25",
  "/r/ClaudeAI/search?q=AnthropicAI+OR+mikeyk+OR+claude_code&restrict_sr=1&sort=new&t=week&limit=15",
];

export async function fetchReddit(): Promise<RawItem[]> {
  const token = await getRedditOAuthToken();
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
