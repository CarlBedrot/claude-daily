import { TabKey } from "@/types/daily";

const STORAGE_PREFIX = "claude-daily";
const LAST_VISIT_KEY = `${STORAGE_PREFIX}:lastVisit`;
const READ_STORIES_KEY = (date: string) => `${STORAGE_PREFIX}:read:${date}`;

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getLastVisitDate(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(LAST_VISIT_KEY);
}

export function setLastVisitDate(date: string): void {
  if (!isClient()) return;
  localStorage.setItem(LAST_VISIT_KEY, date);
}

export function getReadStoryIds(date: string): Set<string> {
  if (!isClient()) return new Set();
  try {
    const raw = localStorage.getItem(READ_STORIES_KEY(date));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function markStoryRead(date: string, storyId: string): void {
  if (!isClient()) return;
  const existing = getReadStoryIds(date);
  existing.add(storyId);
  localStorage.setItem(READ_STORIES_KEY(date), JSON.stringify([...existing]));
}

export function getUnreadCount(
  date: string,
  tabKey: TabKey,
  storyIds: string[],
): number {
  const readIds = getReadStoryIds(date);
  return storyIds.filter((id) => !readIds.has(id)).length;
}

export function getDaysMissed(
  currentDate: string,
  availableDates: string[],
): number {
  const lastVisit = getLastVisitDate();
  if (!lastVisit) return 0;
  if (lastVisit >= currentDate) return 0;

  const missedDates = availableDates.filter(
    (d) => d > lastVisit && d < currentDate,
  );
  return missedDates.length;
}

export function getMissedDates(
  currentDate: string,
  availableDates: string[],
): string[] {
  const lastVisit = getLastVisitDate();
  if (!lastVisit) return [];

  return availableDates.filter((d) => d > lastVisit && d < currentDate);
}

const CATCHUP_DISMISSED_KEY = `${STORAGE_PREFIX}:catchUpDismissedThrough`;

function latestOf(dates: string[]): string {
  return dates.reduce((a, b) => (a > b ? a : b));
}

export function dismissCatchUp(missedDates: string[]): void {
  if (!isClient() || missedDates.length === 0) return;
  localStorage.setItem(CATCHUP_DISMISSED_KEY, latestOf(missedDates));
}

// Dismissed as long as no missed date is newer than the one dismissed through —
// new missed days bring the banner back.
export function isCatchUpDismissed(missedDates: string[]): boolean {
  if (!isClient() || missedDates.length === 0) return false;
  const dismissedThrough = localStorage.getItem(CATCHUP_DISMISSED_KEY);
  if (!dismissedThrough) return false;
  return latestOf(missedDates) <= dismissedThrough;
}
