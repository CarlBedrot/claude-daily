export type RawItem = {
  title: string;
  url: string;
  content: string;
  source_type: "blog" | "reddit";
  published_at: string;
  score?: number;
};
