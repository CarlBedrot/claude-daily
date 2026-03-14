import { fetchAllSources } from "./sources/fetch-all";
import { summarize } from "./summarize";
import { fetchTipSources, getExistingSourceUrls } from "./sources/tip-registry";
import { summarizeTips } from "./summarize-tips";
import { Story } from "../src/types/daily";
import fs from "fs";
import path from "path";

const DAILY_TIP_COUNT = 5;

async function main() {
  console.log("Fetching sources...");

  const {
    blogItems,
    redditItems,
    changelogItems,
    hackernewsItems,
    twitterItems,
    filtered,
  } = await fetchAllSources();

  console.log(`  Blog: ${blogItems.length} items`);
  console.log(`  Reddit: ${redditItems.length} items`);
  console.log(`  Changelog: ${changelogItems.length} items`);
  console.log(`  HackerNews: ${hackernewsItems.length} items`);
  console.log(`  Twitter: ${twitterItems.length} items`);
  const totalRaw =
    blogItems.length +
    redditItems.length +
    changelogItems.length +
    hackernewsItems.length +
    twitterItems.length;
  console.log(`  Total raw: ${totalRaw} items`);
  console.log(
    `  After filtering (time + dedup + recent-day exclusion): ${filtered.length} items`,
  );

  if (filtered.length === 0) {
    console.log("No items found. Generating placeholder...");
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const dailyTips = selectDailyTips([], DAILY_TIP_COUNT);
    const placeholder = {
      date: dateStr,
      generated_at: now.toISOString(),
      tabs: {
        claude_ai: { label: "Claude.ai", stories: [] },
        claude_code: { label: "Claude Code", stories: [] },
        community: { label: "Community", stories: [] },
        tips: { label: "Tips", stories: dailyTips },
      },
    };
    writeOutput(dateStr, placeholder);
    return;
  }

  console.log("Summarizing with Claude...");
  const [briefing, newTips] = await Promise.all([
    summarize(filtered),
    generateTips(),
  ]);

  const dailyTips = selectDailyTips(newTips, DAILY_TIP_COUNT);
  briefing.tabs.tips = { label: "Tips", stories: dailyTips };
  console.log(
    `  Daily tips: ${dailyTips.length} (${newTips.length} new + ${dailyTips.length - newTips.length} from archive)`,
  );

  writeOutput(briefing.date, briefing);
  console.log("Done!");
}

async function generateTips(): Promise<Story[]> {
  console.log("\nFetching tip sources...");
  try {
    const tipSources = await fetchTipSources();
    console.log(`  Found ${tipSources.length} new tip candidates`);

    if (tipSources.length === 0) {
      console.log("  No new tips to process.");
      return [];
    }

    console.log("Summarizing tips with Claude...");
    const newTips = await summarizeTips(tipSources);
    console.log(`  Extracted ${newTips.length} actionable tips`);

    if (newTips.length > 0) {
      appendTips(newTips);
    }

    return newTips;
  } catch (error) {
    console.error("Tip generation failed (non-fatal):", error);
    return [];
  }
}

function getRecentlyShownTipIds(daysBack: number = 7): Set<string> {
  const ids = new Set<string>();
  const dataDir = path.join(process.cwd(), "data");

  for (let i = 1; i <= daysBack; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const filePath = path.join(dataDir, `${dateStr}.json`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const tips = data.tabs?.tips?.stories ?? [];
      for (const tip of tips) {
        if (tip.id) ids.add(tip.id);
      }
    } catch {
      // File doesn't exist or is malformed — skip
    }
  }

  return ids;
}

function selectDailyTips(newTips: Story[], count: number): Story[] {
  if (newTips.length >= count) {
    return newTips.slice(0, count);
  }

  const archive = readTipArchive();
  const newUrls = new Set(newTips.flatMap((t) => t.sources.map((s) => s.url)));
  const recentlyShown = getRecentlyShownTipIds(7);

  // First pass: tips not shown in the last 7 days
  const fresh = archive.filter(
    (t) =>
      !t.sources.some((s) => newUrls.has(s.url)) && !recentlyShown.has(t.id),
  );

  // Shuffle fresh tips
  for (let i = fresh.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fresh[i], fresh[j]] = [fresh[j], fresh[i]];
  }

  const needed = count - newTips.length;
  if (fresh.length >= needed) {
    return [...newTips, ...fresh.slice(0, needed)];
  }

  // If archive is exhausted, fall back to oldest-shown-first from recently shown
  const remaining = needed - fresh.length;
  const fallback = archive.filter(
    (t) =>
      !t.sources.some((s) => newUrls.has(s.url)) &&
      recentlyShown.has(t.id) &&
      !fresh.some((f) => f.id === t.id),
  );

  // Shuffle fallback too
  for (let i = fallback.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [fallback[i], fallback[j]] = [fallback[j], fallback[i]];
  }

  return [...newTips, ...fresh, ...fallback.slice(0, remaining)];
}

function readTipArchive(): Story[] {
  try {
    const tipsPath = path.join(process.cwd(), "data", "tips.json");
    const data = JSON.parse(fs.readFileSync(tipsPath, "utf-8"));
    return data.tips ?? [];
  } catch {
    return [];
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
