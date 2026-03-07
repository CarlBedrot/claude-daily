export type SourceType = "blog" | "reddit" | "twitter";

export type Source = {
  type: SourceType;
  title: string;
  url: string;
  published_at: string;
};

export type Story = {
  id: string;
  headline: string;
  summary: string;
  key_points?: string[];
  sources: Source[];
  perspectives?: string;
};

export type Tab = {
  label: string;
  stories: Story[];
};

export type TabKey = "claude_ai" | "claude_code" | "cowork";

export type DailyBriefing = {
  date: string;
  generated_at: string;
  tabs: Record<TabKey, Tab>;
};
