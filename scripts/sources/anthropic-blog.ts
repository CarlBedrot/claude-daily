import { RawItem } from "./types";
import fs from "fs";
import path from "path";

const SITEMAP_URL = "https://www.anthropic.com/sitemap.xml";
const STATE_PATH = path.join(process.cwd(), "data", ".blog-state.json");

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function loadFirstSeen(): Record<string, string> {
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
  } catch {
    return {};
  }
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

    // <lastmod> reflects when Anthropic's site last touched the page (a
    // redesign, an unrelated CMS edit), not when the article was actually
    // published. Using it directly lets old evergreen posts resurface as
    // "new" any time the site rebuilds the page. Freeze published_at to the
    // lastmod value seen the first time our pipeline observes a given URL,
    // so later lastmod churn on an already-known post can't re-freshen it.
    const firstSeen = loadFirstSeen();

    while ((match = urlRegex.exec(xml)) !== null) {
      const url = match[1];
      const lastmod = new Date(match[2]).toISOString();
      const slug = url.split("/news/")[1];

      if (!firstSeen[url]) {
        firstSeen[url] = lastmod;
      }

      items.push({
        title: slugToTitle(slug),
        url,
        content: slugToTitle(slug),
        source_type: "blog",
        published_at: firstSeen[url],
      });
    }

    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(firstSeen, null, 2));

    return items;
  } catch (error) {
    console.error("Failed to fetch Anthropic blog:", error);
    return [];
  }
}
