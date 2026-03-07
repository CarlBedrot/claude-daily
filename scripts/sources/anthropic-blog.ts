import { RawItem } from "./types";

const ANTHROPIC_RSS_URL = "https://www.anthropic.com/rss.xml";

export async function fetchAnthropicBlog(): Promise<RawItem[]> {
  try {
    const response = await fetch(ANTHROPIC_RSS_URL);
    const xml = await response.text();

    const items: RawItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title =
        itemXml.match(/<title><!\[CDATA\[(.*?)\]\]>/)?.[1] ||
        itemXml.match(/<title>(.*?)<\/title>/)?.[1] ||
        "";
      const link = itemXml.match(/<link>(.*?)<\/link>/)?.[1] || "";
      const description =
        itemXml.match(/<description><!\[CDATA\[([\s\S]*?)\]\]>/)?.[1] ||
        itemXml.match(/<description>(.*?)<\/description>/)?.[1] ||
        "";
      const pubDate = itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

      if (title && link) {
        items.push({
          title: title.trim(),
          url: link.trim(),
          content: description.replace(/<[^>]*>/g, "").trim(),
          source_type: "blog",
          published_at: new Date(pubDate).toISOString(),
        });
      }
    }

    return items;
  } catch (error) {
    console.error("Failed to fetch Anthropic blog:", error);
    return [];
  }
}
