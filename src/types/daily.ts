export type SourceType = "blog" | "reddit" | "twitter" | "hackernews";

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
  impact?: string;
  author?: { name: string; role: string };
  actionable_steps?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimated_minutes?: number;
};

export type Tab = {
  label: string;
  stories: Story[];
};

export type TabKey = "claude_ai" | "claude_code" | "community" | "tips";

export const NEWS_TAB_KEYS: readonly (
  | "claude_ai"
  | "claude_code"
  | "community"
)[] = ["claude_ai", "claude_code", "community"] as const;

export type Digest = {
  lead: string;
  themes: string[];
  summary: string;
};

export type DailyBriefing = {
  date: string;
  generated_at: string;
  digest?: string | Digest;
  tabs: Record<TabKey, Tab>;
};
