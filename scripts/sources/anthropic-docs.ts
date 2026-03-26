import { RawItem } from "./types";

const DOCS_PAGES = [
  "https://docs.anthropic.com/en/docs/claude-code/best-practices",
  "https://docs.anthropic.com/en/docs/claude-code/overview",
  "https://docs.anthropic.com/en/docs/claude-code/mcp",
  "https://docs.anthropic.com/en/docs/claude-code/settings",
  "https://docs.anthropic.com/en/docs/claude-code/hooks",
  "https://docs.anthropic.com/en/docs/claude-code/memory",
  "https://docs.anthropic.com/en/docs/claude-code/ide-integrations",
];

export async function fetchAnthropicDocs(): Promise<RawItem[]> {
  const items: RawItem[] = [];

  for (const url of DOCS_PAGES) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ClaudeDaily/1.0; +https://github.com/CarlBedrot/claude-daily)",
          Accept: "text/html",
        },
      });

      if (!response.ok) continue;

      const html = await response.text();

      // Extract text content from the page body, stripping HTML tags
      const bodyMatch =
        html.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ??
        html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

      if (!bodyMatch) continue;

      const textContent = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);

      const slug = url.split("/").pop() ?? "docs";
      const title = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      items.push({
        title: `Claude Code Docs: ${title}`,
        url,
        content: textContent,
        source_type: "blog",
        published_at: new Date().toISOString(),
      });
    } catch {
      // Skip failed pages
    }
  }

  return items;
}
