import { fetchAnthropicBlog } from "./anthropic-blog";
import { fetchReddit } from "./reddit";
import { fetchClaudeCodeChangelog } from "./claude-code-changelog";
import { filterItems } from "../filter";
import { RawItem } from "./types";

type FetchResult = {
  blogItems: RawItem[];
  redditItems: RawItem[];
  changelogItems: RawItem[];
  filtered: RawItem[];
};

export async function fetchAllSources(): Promise<FetchResult> {
  const [blogItems, redditItems, changelogItems] = await Promise.all([
    fetchAnthropicBlog(),
    fetchReddit(),
    fetchClaudeCodeChangelog(),
  ]);

  const allItems = [...blogItems, ...redditItems, ...changelogItems];
  const filtered = filterItems(allItems);

  return { blogItems, redditItems, changelogItems, filtered };
}
