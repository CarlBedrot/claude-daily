import { DailyBriefing, Story, TabKey } from "@/types/daily";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export type SearchResult = {
  date: string;
  tabKey: TabKey;
  tabLabel: string;
  story: Story;
  matchContext: string;
};

export function getAvailableDates(): string[] {
  try {
    return fs
      .readdirSync(DATA_DIR)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export function getBriefing(date?: string): DailyBriefing | null {
  const dates = getAvailableDates();

  const targetDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : dates[0];
  if (!targetDate) {
    try {
      const samplePath = path.join(DATA_DIR, "sample.json");
      return JSON.parse(fs.readFileSync(samplePath, "utf-8"));
    } catch {
      return null;
    }
  }

  try {
    const filePath = path.join(DATA_DIR, `${targetDate}.json`);
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

export function getTips(): Story[] {
  try {
    const filePath = path.join(DATA_DIR, "tips.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return data.tips ?? [];
  } catch {
    return [];
  }
}

export function searchBriefings(query: string): SearchResult[] {
  const dates = getAvailableDates();
  const results: SearchResult[] = [];
  const lowerQuery = query.toLowerCase();

  for (const date of dates) {
    const briefing = getBriefing(date);
    if (!briefing) continue;

    for (const [tabKey, tab] of Object.entries(briefing.tabs)) {
      for (const story of tab.stories) {
        const searchableText = [
          story.headline,
          story.summary,
          ...(story.key_points ?? []),
          ...(story.actionable_steps ?? []),
          story.perspectives ?? "",
        ].join(" ");

        if (searchableText.toLowerCase().includes(lowerQuery)) {
          results.push({
            date,
            tabKey: tabKey as TabKey,
            tabLabel: tab.label,
            story,
            matchContext: extractSnippet(story.summary, lowerQuery),
          });
        }
      }
    }
  }

  return results;
}

function extractSnippet(text: string, query: string): string {
  const lower = text.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) return text.slice(0, 150);

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + query.length + 60);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";
  return snippet;
}
