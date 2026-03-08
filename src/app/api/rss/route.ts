import { getBriefing } from "@/lib/data";
import { NEWS_TAB_KEYS } from "@/types/daily";

const SITE_URL = process.env.SITE_URL ?? "https://claude-daily-one.vercel.app";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const briefing = getBriefing();
  if (!briefing) {
    return new Response(
      "<rss><channel><title>Claude Daily</title></channel></rss>",
      {
        status: 200,
        headers: { "Content-Type": "application/rss+xml" },
      },
    );
  }

  const newsTabs = NEWS_TAB_KEYS;

  const items = newsTabs.flatMap((tabKey) => {
    const tab = briefing.tabs[tabKey];
    if (!tab) {
      return [];
    }
    return tab.stories.map((story) => {
      const link = story.sources[0]?.url ?? SITE_URL;
      const pubDate = story.sources[0]?.published_at
        ? new Date(story.sources[0].published_at).toUTCString()
        : new Date(briefing.generated_at).toUTCString();

      return `    <item>
      <title>${escapeXml(story.headline)}</title>
      <description>${escapeXml(story.summary)}</description>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(story.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(tab.label)}</category>
    </item>`;
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Claude Daily</title>
    <description>Your daily briefing on everything Claude</description>
    <link>${SITE_URL}</link>
    <lastBuildDate>${new Date(briefing.generated_at).toUTCString()}</lastBuildDate>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
