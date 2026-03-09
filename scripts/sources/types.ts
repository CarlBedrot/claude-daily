export type RawItem = {
  title: string;
  url: string;
  content: string;
  source_type: "blog" | "reddit" | "hackernews" | "changelog";
  published_at: string;
  score?: number;
  metadata?: Record<string, unknown>;
};
