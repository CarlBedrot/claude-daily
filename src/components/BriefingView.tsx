"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DailyBriefing, NEWS_TAB_KEYS, TabKey } from "@/types/daily";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { StoryCard } from "./StoryCard";
import { TipCard } from "./TipCard";
import { DigestBanner } from "./DigestBanner";
import { QuietDayBanner } from "./QuietDayBanner";
import { CatchUpBanner } from "./CatchUpBanner";
import { AudioPlayer } from "./AudioPlayer";
import {
  setLastVisitDate,
  markStoryRead,
  getUnreadCount,
  getMissedDates,
} from "@/lib/reading-state";

const ALL_TABS: TabKey[] = ["claude_ai", "claude_code", "community", "tips"];

type BriefingViewProps = {
  briefing: DailyBriefing;
  availableDates: string[];
};

export function BriefingView({ briefing, availableDates }: BriefingViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("claude_ai");
  const [unreadCounts, setUnreadCounts] = useState<Record<TabKey, number>>(
    {} as Record<TabKey, number>,
  );
  const [missedDates, setMissedDates] = useState<string[]>([]);
  const router = useRouter();

  const dates = availableDates.length > 0 ? availableDates : [briefing.date];

  const activeStories = briefing.tabs[activeTab]?.stories ?? [];

  const storyCounts = Object.fromEntries(
    Object.entries(briefing.tabs).map(([key, tab]) => [
      key,
      tab.stories.length,
    ]),
  ) as Record<TabKey, number>;

  const totalNonTipStories = NEWS_TAB_KEYS.reduce(
    (sum, key) => sum + (briefing.tabs[key]?.stories?.length ?? 0),
    0,
  );
  const isQuietDay = totalNonTipStories < 3;

  const recalcUnread = useCallback(() => {
    const counts = {} as Record<TabKey, number>;
    for (const key of ALL_TABS) {
      const ids = (briefing.tabs[key]?.stories ?? []).map((s) => s.id);
      counts[key] = getUnreadCount(briefing.date, key, ids);
    }
    setUnreadCounts(counts);
  }, [briefing]);

  useEffect(() => {
    setMissedDates(getMissedDates(briefing.date, dates));
    setLastVisitDate(briefing.date);
    recalcUnread();
  }, [briefing.date]);

  const handleStoryRead = useCallback(
    (storyId: string) => {
      markStoryRead(briefing.date, storyId);
      recalcUnread();
    },
    [briefing.date, recalcUnread],
  );

  const navigateToDate = (date: string) => router.push(`/?date=${date}`);

  const handleYesterday = () => {
    const currentIndex = dates.indexOf(briefing.date);
    const yesterday = dates[currentIndex + 1];
    if (yesterday) {
      navigateToDate(yesterday);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const currentIndex = dates.indexOf(briefing.date);

      switch (e.key) {
        case "ArrowLeft": {
          if (currentIndex < dates.length - 1) {
            navigateToDate(dates[currentIndex + 1]);
          }
          break;
        }
        case "ArrowRight": {
          if (currentIndex > 0) {
            navigateToDate(dates[currentIndex - 1]);
          }
          break;
        }
        case "1":
          setActiveTab("claude_ai");
          break;
        case "2":
          setActiveTab("claude_code");
          break;
        case "3":
          setActiveTab("community");
          break;
        case "4":
          setActiveTab("tips");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dates, briefing.date]);

  return (
    <div className="min-h-screen bg-cream">
      <TopBar
        date={briefing.date}
        availableDates={dates}
        onDateChange={navigateToDate}
      />
      <CatchUpBanner
        missedDates={missedDates}
        onNavigateToDate={navigateToDate}
      />
      {briefing.audio_url && <AudioPlayer audioUrl={briefing.audio_url} />}
      {briefing.digest && <DigestBanner digest={briefing.digest} />}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        storyCounts={storyCounts}
        unreadCounts={unreadCounts}
      />
      <main className="max-w-3xl mx-auto px-4 py-2">
        {isQuietDay && activeTab !== "tips" ? (
          <QuietDayBanner
            onNavigate={handleYesterday}
            onSwitchTab={() => setActiveTab("tips")}
          />
        ) : activeStories.length === 0 ? (
          <p className="py-12 text-center text-gray-secondary">
            No stories in this category today.
          </p>
        ) : (
          activeStories.map((story, index) =>
            activeTab === "tips" ? (
              <TipCard
                key={story.id}
                story={story}
                isLead={index === 0}
                onStoryRead={handleStoryRead}
                date={briefing.date}
              />
            ) : (
              <StoryCard
                key={story.id}
                story={story}
                isLead={index === 0}
                onStoryRead={handleStoryRead}
                date={briefing.date}
              />
            ),
          )
        )}
      </main>
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-gray-secondary">
        Generated {new Date(briefing.generated_at).toLocaleString()} · Powered
        by Claude
        {" · "}
        <a
          href="/api/rss"
          className="text-claude-orange hover:text-claude-orange-hover"
        >
          RSS
        </a>
        <span className="block mt-1 text-gray-secondary/50">
          ← → navigate days · 1-4 switch tabs
        </span>
      </footer>
    </div>
  );
}
