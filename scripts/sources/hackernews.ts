import { RawItem } from "./types";

const ALGOLIA_API = "https://hn.algolia.com/api/v1/search";

// Search queries for Claude/Anthropic content
const SEARCH_QUERIES = [
  "Claude AI",
  "Anthropic",
  "Claude Sonnet",
  "Claude Opus",
  "Claude API",
];

type HNHit = {
  objectID: string;
  title: string;
  url: string | null;
  story_url?: string;
  created_at: string;
  points: number;
  num_comments: number;
  author: string;
};

type HNResponse = {
  hits: HNHit[];
};

async function searchHN(query: string): Promise<HNHit[]> {
  const params = new URLSearchParams({
    query,
    tags: "story",
    numericFilters: "created_at_i>" + Math.floor(Date.now() / 1000 - 7 * 24 * 60 * 60), // Last 7 days
    hitsPerPage: "20",
  });

  try {
    const response = await fetch(`${ALGOLIA_API}?${params}`, {
      headers: {
        "User-Agent": "ClaudeDaily/1.0",
      },
    });

    if (!response.ok) {
      console.error(`HN search failed for "${query}": ${response.status}`);
      return [];
    }

    const data: HNResponse = await response.json();
    return data.hits;
  } catch (error) {
    console.error(`HN search error for "${query}":`, error);
    return [];
  }
}

export async function fetchHackerNews(): Promise<RawItem[]> {
  // Run all searches in parallel
  const results = await Promise.all(SEARCH_QUERIES.map(searchHN));
  const allHits = results.flat();

  // Dedupe by objectID
  const seen = new Set<string>();
  const uniqueHits = allHits.filter((hit) => {
    if (seen.has(hit.objectID)) return false;
    seen.add(hit.objectID);
    return true;
  });

  // Filter: minimum 5 points to avoid noise
  const filtered = uniqueHits.filter((hit) => hit.points >= 5);

  // Sort by points (most popular first)
  filtered.sort((a, b) => b.points - a.points);

  // Take top 15
  const top = filtered.slice(0, 15);

  return top.map((hit) => ({
    title: hit.title,
    url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
    content: `${hit.points} points, ${hit.num_comments} comments on Hacker News`,
    source_type: "hackernews" as const,
    published_at: new Date(hit.created_at).toISOString(),
    metadata: {
      hn_id: hit.objectID,
      points: hit.points,
      comments: hit.num_comments,
      author: hit.author,
      hn_url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    },
  }));
}
