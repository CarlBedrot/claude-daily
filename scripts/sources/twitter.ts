import { RawItem } from "./types";

const TWITTER_API = "https://api.twitter.com/2/tweets/search/recent";

const SEARCH_QUERIES = [
  '"Claude Code" -is:retweet',
  "from:AnthropicAI -is:retweet",
  "from:alexalbert__ Claude -is:retweet",
  '"Claude AI" (update OR release OR feature) -is:retweet',
];

type TwitterUser = { id: string; username: string; name: string };
type TwitterMetrics = {
  like_count: number;
  retweet_count: number;
  reply_count: number;
};
type TwitterTweet = {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  public_metrics: TwitterMetrics;
};

export async function fetchTwitter(): Promise<RawItem[]> {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) {
    console.log("  Skipping Twitter (no TWITTER_BEARER_TOKEN)");
    return [];
  }

  const allTweets: RawItem[] = [];
  const seen = new Set<string>();

  for (const query of SEARCH_QUERIES) {
    try {
      const params = new URLSearchParams({
        query,
        max_results: "20",
        "tweet.fields": "created_at,public_metrics,author_id",
        expansions: "author_id",
        "user.fields": "username,name",
      });

      const response = await fetch(`${TWITTER_API}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error(
          `  Twitter search failed for "${query}": ${response.status}`,
        );
        continue;
      }

      const data = await response.json();
      const users = new Map<string, TwitterUser>(
        (data.includes?.users ?? []).map((u: TwitterUser) => [u.id, u]),
      );

      for (const tweet of (data.data ?? []) as TwitterTweet[]) {
        if (seen.has(tweet.id)) continue;
        seen.add(tweet.id);

        const metrics = tweet.public_metrics;
        const engagement = metrics.like_count + metrics.retweet_count * 2;
        if (engagement < 3) continue;

        const user = users.get(tweet.author_id);
        const username = user?.username ?? "unknown";

        allTweets.push({
          title: `@${username}: ${tweet.text.slice(0, 100)}`,
          url: `https://twitter.com/${username}/status/${tweet.id}`,
          content: tweet.text,
          source_type: "twitter",
          published_at: tweet.created_at,
          score: engagement,
        });
      }

      // Respect free tier rate limit (~1 req/sec)
      await new Promise((resolve) => setTimeout(resolve, 1100));
    } catch (error) {
      console.error(`  Twitter fetch error for "${query}":`, error);
    }
  }

  allTweets.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return allTweets.slice(0, 15);
}
