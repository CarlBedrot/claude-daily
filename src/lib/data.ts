import { DailyBriefing, Story } from "@/types/daily";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

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
