"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DailyBriefing, NEWS_TAB_KEYS, TabKey } from "@/types/daily";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { StoryCard } from "./StoryCard";
import { TipCard } from "./TipCard";
import { DigestBanner } from "./DigestBanner";
import { QuietDayBanner } from "./QuietDayBanner";

type BriefingViewProps = {
  briefing: DailyBriefing;
  availableDates: string[];
};

export function BriefingView({ briefing, availableDates }: BriefingViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("claude_ai");
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

  const handleYesterday = () => {
    const currentIndex = dates.indexOf(briefing.date);
    const yesterday = dates[currentIndex + 1];
    if (yesterday) {
      router.push(`/?date=${yesterday}`);
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <TopBar
        date={briefing.date}
        availableDates={dates}
        onDateChange={(date) => router.push(`/?date=${date}`)}
      />
      {briefing.digest && <DigestBanner digest={briefing.digest} />}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        storyCounts={storyCounts}
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
              <TipCard key={story.id} story={story} />
            ) : (
              <StoryCard key={story.id} story={story} isLead={index === 0} />
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
      </footer>
    </div>
  );
}
