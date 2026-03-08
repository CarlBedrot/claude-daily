import { fetchAnthropicBlog } from "./sources/anthropic-blog";
import { fetchReddit } from "./sources/reddit";
import { fetchClaudeCodeChangelog } from "./sources/claude-code-changelog";
import { filterItems } from "./filter";
import { summarize } from "./summarize";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Fetching sources...");

  const [blogItems, redditItems, changelogItems] = await Promise.all([
    fetchAnthropicBlog(),
    fetchReddit(),
    fetchClaudeCodeChangelog(),
  ]);

  console.log(`  Blog: ${blogItems.length} items`);
  console.log(`  Reddit: ${redditItems.length} items`);
  console.log(`  Changelog: ${changelogItems.length} items`);
  console.log(
    `  Total raw: ${blogItems.length + redditItems.length + changelogItems.length} items`,
  );

  const allItems = [...blogItems, ...redditItems, ...changelogItems];
  const filtered = filterItems(allItems);

  console.log(`  After filtering: ${filtered.length} items`);

  if (filtered.length === 0) {
    console.log("No items found. Generating placeholder...");
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const placeholder = {
      date: dateStr,
      generated_at: now.toISOString(),
      tabs: {
        claude_ai: { label: "Claude.ai", stories: [] },
        claude_code: { label: "Claude Code", stories: [] },
        cowork: { label: "Cowork", stories: [] },
      },
    };
    writeOutput(dateStr, placeholder);
    return;
  }

  console.log("Summarizing with Claude...");
  const briefing = await summarize(filtered);

  writeOutput(briefing.date, briefing);
  console.log("Done!");
}

function writeOutput(date: string, data: unknown) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, `${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  Written to ${filePath}`);
}

main().catch((error) => {
  console.error("Generation failed:", error);
  process.exit(1);
});
