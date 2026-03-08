import Anthropic from "@anthropic-ai/sdk";
import { RawItem } from "./sources/types";
import { DailyBriefing } from "../src/types/daily";

const SYSTEM_PROMPT = `You are a news editor for "Claude Daily", a daily briefing about the Claude AI ecosystem.

You receive raw news items from various sources. Your job is to:

1. Categorize each item into one of three tabs:
   - claude_ai: Claude.ai product updates, model releases, features, pricing, general Anthropic news
   - claude_code: Claude Code CLI, SDK updates, developer tooling, coding workflows
   - community: Community projects, creative uses, ecosystem discussions, third-party tools, tutorials, Claude Cowork features, enterprise usage patterns, user workflows and experiences

2. Group related items into single stories (e.g., a blog post and Reddit discussion about the same announcement)

3. For each story, generate:
   - A clear, concise headline (newspaper style, not clickbait)
   - A 2-3 sentence summary synthesizing all sources
   - Key points (only for stories that warrant them, 2-3 bullets max)
   - Perspectives (only when sources disagree or there is genuine nuance)
   - IMPORTANT: Embed inline source references using [N] notation in the summary, key_points, and perspectives text. N is the 1-indexed position of the source in that story's sources array. Place them after the claims they support, like: "Claude now supports extended thinking [1], which the community has praised [2]."

4. Include 5-10 stories per tab. If a tab has fewer items, that is fine.

5. If an item does not clearly fit Claude ecosystem news, discard it.

6. Generate a "digest" field: 2-3 sentences summarizing today's biggest highlights across ALL tabs. Write like a morning briefing editor — conversational, direct. Lead with the single most important story.

Output ONLY valid JSON matching this exact schema:
{
  "digest": "Today's biggest story is...",
  "tabs": {
    "claude_ai": {
      "label": "Claude.ai",
      "stories": [{ "id": "claude-ai-001", "headline": "", "summary": "", "key_points": [], "sources": [{ "type": "blog|reddit|twitter", "title": "", "url": "", "published_at": "" }], "perspectives": "" }]
    },
    "claude_code": { "label": "Claude Code", "stories": [...] },
    "community": { "label": "Community", "stories": [...] }
  }
}`;

export async function summarize(items: RawItem[]): Promise<DailyBriefing> {
  const client = new Anthropic();

  const itemsSummary = items
    .map(
      (item, i) =>
        `[${i + 1}] Source: ${item.source_type} | Score: ${item.score ?? "N/A"}
Title: ${item.title}
URL: ${item.url}
Published: ${item.published_at}
Content: ${item.content.slice(0, 500)}`,
    )
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Here are today's raw news items about Claude. Categorize, group, and summarize them into a daily briefing.\n\n${itemsSummary}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text : "";
  const text = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  const parsed = JSON.parse(text);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  return {
    date: dateStr,
    generated_at: now.toISOString(),
    digest: parsed.digest,
    tabs: parsed.tabs,
  };
}
