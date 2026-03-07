"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DailyBriefing, TabKey } from "@/types/daily";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { StoryCard } from "./StoryCard";

type BriefingViewProps = {
  briefing: DailyBriefing;
  availableDates: string[];
};

export function BriefingView({ briefing, availableDates }: BriefingViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("claude_ai");
  const router = useRouter();

  const dates = availableDates.length > 0 ? availableDates : [briefing.date];

  const storyCounts: Record<TabKey, number> = {
    claude_ai: briefing.tabs.claude_ai.stories.length,
    claude_code: briefing.tabs.claude_code.stories.length,
    cowork: briefing.tabs.cowork.stories.length,
  };

  const activeStories = briefing.tabs[activeTab].stories;

  return (
    <div className="min-h-screen bg-cream">
      <TopBar
        date={briefing.date}
        availableDates={dates}
        onDateChange={(date) => router.push(`/?date=${date}`)}
      />
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        storyCounts={storyCounts}
      />
      <main className="max-w-3xl mx-auto px-4 py-2">
        {activeStories.length === 0 ? (
          <p className="py-12 text-center text-gray-secondary">
            No stories in this category today.
          </p>
        ) : (
          activeStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))
        )}
      </main>
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-gray-secondary">
        Generated {new Date(briefing.generated_at).toLocaleString()} · Powered
        by Claude
      </footer>
    </div>
  );
}
