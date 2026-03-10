export type RawItem = {
  title: string;
  url: string;
  content: string;
  source_type: "blog" | "reddit" | "hackernews" | "changelog" | "twitter";
  published_at: string;
  score?: number;
  metadata?: Record<string, unknown>;
};
