import { RawItem } from "./types";

const SITEMAP_URL = "https://www.anthropic.com/sitemap.xml";

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function fetchAnthropicBlog(): Promise<RawItem[]> {
  try {
    const response = await fetch(SITEMAP_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ClaudeDaily/1.0; +https://github.com/CarlBedrot/claude-daily)",
      },
    });
    const xml = await response.text();

    const items: RawItem[] = [];
    const urlRegex =
      /<url>\s*<loc>(https:\/\/www\.anthropic\.com\/news\/[^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g;
    let match;

    while ((match = urlRegex.exec(xml)) !== null) {
      const url = match[1];
      const lastmod = match[2];
      const slug = url.split("/news/")[1];

      items.push({
        title: slugToTitle(slug),
        url,
        content: slugToTitle(slug),
        source_type: "blog",
        published_at: new Date(lastmod).toISOString(),
      });
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch Anthropic blog:", error);
    return [];
  }
}
