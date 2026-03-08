import { fetchAllSources } from "./sources/fetch-all";
import { summarize } from "./summarize";
import { fetchTipSources, getExistingSourceUrls } from "./sources/tip-registry";
import { summarizeTips } from "./summarize-tips";
import { Story } from "../src/types/daily";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Fetching sources...");

  const { blogItems, redditItems, changelogItems, filtered } =
    await fetchAllSources();

  console.log(`  Blog: ${blogItems.length} items`);
  console.log(`  Reddit: ${redditItems.length} items`);
  console.log(`  Changelog: ${changelogItems.length} items`);
  console.log(
    `  Total raw: ${blogItems.length + redditItems.length + changelogItems.length} items`,
  );
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
        community: { label: "Community", stories: [] },
      },
    };
    writeOutput(dateStr, placeholder);
    return;
  }

  console.log("Summarizing with Claude...");
  const [briefing] = await Promise.all([summarize(filtered), generateTips()]);

  writeOutput(briefing.date, briefing);
  console.log("Done!");
}

async function generateTips() {
  console.log("\nFetching tip sources...");
  try {
    const tipSources = await fetchTipSources();
    console.log(`  Found ${tipSources.length} new tip candidates`);

    if (tipSources.length === 0) {
      console.log("  No new tips to process.");
      return;
    }

    console.log("Summarizing tips with Claude...");
    const newTips = await summarizeTips(tipSources);
    console.log(`  Extracted ${newTips.length} actionable tips`);

    if (newTips.length === 0) return;

    appendTips(newTips);
  } catch (error) {
    console.error("Tip generation failed (non-fatal):", error);
  }
}

function appendTips(newTips: Story[]) {
  const tipsPath = path.join(process.cwd(), "data", "tips.json");

  let existing: { tips: Story[] } = { tips: [] };
  try {
    existing = JSON.parse(fs.readFileSync(tipsPath, "utf-8"));
  } catch {
    // File doesn't exist yet, start fresh
  }

  const existingUrls = getExistingSourceUrls();
  const deduped = newTips.filter(
    (tip) => !tip.sources.some((s) => existingUrls.has(s.url)),
  );

  if (deduped.length === 0) {
    console.log("  All tips already exist, skipping.");
    return;
  }

  existing.tips.push(...deduped);
  fs.writeFileSync(tipsPath, JSON.stringify(existing, null, 2));
  console.log(`  Appended ${deduped.length} tips to data/tips.json`);
}

function writeOutput(date: string, data: unknown) {
  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  const filePath = path.join(dataDir, `${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  Written to ${filePath}`);
}

main().catch((error) => {
  console.error("Generation failed:", error);
  process.exit(1);
});
