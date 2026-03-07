import { DailyBriefing } from "@/types/daily";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export function getAvailableDates(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "sample.json")
    .map((f) => f.replace(".json", ""))
    .sort()
    .reverse();
}

export function getBriefing(date?: string): DailyBriefing | null {
  const dates = getAvailableDates();

  const targetDate = date || dates[0];
  if (!targetDate) {
    // Fall back to sample data
    const samplePath = path.join(DATA_DIR, "sample.json");
    if (fs.existsSync(samplePath)) {
      return JSON.parse(fs.readFileSync(samplePath, "utf-8"));
    }
    return null;
  }

  const filePath = path.join(DATA_DIR, `${targetDate}.json`);
  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
