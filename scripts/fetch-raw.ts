import { fetchAnthropicBlog } from "./sources/anthropic-blog";
import { fetchReddit } from "./sources/reddit";
import { fetchClaudeCodeChangelog } from "./sources/claude-code-changelog";
import { filterItems } from "./filter";
import fs from "fs";
import path from "path";

async function main() {
  const [blogItems, redditItems, changelogItems] = await Promise.all([
    fetchAnthropicBlog(),
    fetchReddit(),
    fetchClaudeCodeChangelog(),
  ]);

  const allItems = [...blogItems, ...redditItems, ...changelogItems];
  const filtered = filterItems(allItems);

  const output = {
    fetched_at: new Date().toISOString(),
    counts: {
      blog: blogItems.length,
      reddit: redditItems.length,
      changelog: changelogItems.length,
      after_filter: filtered.length,
    },
    items: filtered,
  };

  const outPath = path.join(process.cwd(), "data", "raw-latest.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output.counts));
}

main().catch((error) => {
  console.error("Fetch failed:", error);
  process.exit(1);
});
