import { fetchAnthropicBlog } from "./anthropic-blog";
import { fetchReddit } from "./reddit";
import { fetchClaudeCodeChangelog } from "./claude-code-changelog";
import { fetchHackerNews } from "./hackernews";
import { filterItems } from "../filter";
import { RawItem } from "./types";

type FetchResult = {
  blogItems: RawItem[];
  redditItems: RawItem[];
  changelogItems: RawItem[];
  hackernewsItems: RawItem[];
  filtered: RawItem[];
};

export async function fetchAllSources(): Promise<FetchResult> {
  const [blogItems, redditItems, changelogItems, hackernewsItems] = await Promise.all([
    fetchAnthropicBlog(),
    fetchReddit(),
    fetchClaudeCodeChangelog(),
    fetchHackerNews(),
  ]);

  const allItems = [...blogItems, ...redditItems, ...changelogItems, ...hackernewsItems];
  const filtered = filterItems(allItems);

  return { blogItems, redditItems, changelogItems, hackernewsItems, filtered };
}
