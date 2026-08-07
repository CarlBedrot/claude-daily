import Anthropic from "@anthropic-ai/sdk";
import { RawItem } from "./sources/types";
import { DailyBriefing } from "../src/types/daily";

const SYSTEM_PROMPT = `You are a news editor for "Claude Daily", a daily briefing about the Claude AI ecosystem.

Today's date is ${new Date().toISOString().split("T")[0]}.

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
   - An "impact" field: 1-2 sentences on why this matters and who it affects most. Be specific — say "developers using Claude Code daily" or "teams evaluating Claude for production", not "the AI community". Skip this field only for minor/trivial stories.
   - IMPORTANT: Embed inline source references using [N] notation in the summary, key_points, and perspectives text. N is the 1-indexed position of the source in that story's sources array. Place them after the claims they support, like: "Claude now supports extended thinking [1], which the community has praised [2]."

4. Include 5-10 stories per tab. If a tab has fewer items, that is fine.

5. If an item does not clearly fit Claude ecosystem news, discard it.

6. TIMELINE AWARENESS: Drop items that are clearly outdated or superseded. For example, if there are items about both "Model X released" and "Model Y released" where Y is the successor to X, only cover Y — the older release is not news anymore. Use the published_at dates and your knowledge to judge freshness. Only include stories that would genuinely be news TODAY.

7. Generate a structured "digest" object with:
   - "lead": 1-2 sentences about THE story of the day. Write like a morning briefing editor — conversational, direct.
   - "themes": 2-3 short tags capturing today's major themes (e.g., "Model updates", "Developer tooling", "Enterprise adoption")
   - "summary": 1-2 sentences covering the other highlights beyond the lead story.

Set "perspectives" and "impact" to null when they don't apply to a story.`;

const SOURCE_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["blog", "reddit", "twitter", "hackernews"] },
    title: { type: "string" },
    url: { type: "string" },
    published_at: { type: "string" },
  },
  required: ["type", "title", "url", "published_at"],
  additionalProperties: false,
};

const STORY_SCHEMA = {
  type: "object",
  properties: {
    id: { type: "string" },
    headline: { type: "string" },
    summary: { type: "string" },
    key_points: { type: "array", items: { type: "string" } },
    sources: { type: "array", items: SOURCE_SCHEMA },
    perspectives: { anyOf: [{ type: "string" }, { type: "null" }] },
    impact: { anyOf: [{ type: "string" }, { type: "null" }] },
  },
  required: ["id", "headline", "summary", "key_points", "sources", "perspectives", "impact"],
  additionalProperties: false,
};

const TAB_SCHEMA = {
  type: "object",
  properties: {
    label: { type: "string" },
    stories: { type: "array", items: STORY_SCHEMA },
  },
  required: ["label", "stories"],
  additionalProperties: false,
};

const BRIEFING_SCHEMA = {
  type: "object",
  properties: {
    digest: {
      type: "object",
      properties: {
        lead: { type: "string" },
        themes: { type: "array", items: { type: "string" } },
        summary: { type: "string" },
      },
      required: ["lead", "themes", "summary"],
      additionalProperties: false,
    },
    tabs: {
      type: "object",
      properties: {
        claude_ai: TAB_SCHEMA,
        claude_code: TAB_SCHEMA,
        community: TAB_SCHEMA,
      },
      required: ["claude_ai", "claude_code", "community"],
      additionalProperties: false,
    },
  },
  required: ["digest", "tabs"],
  additionalProperties: false,
};

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
    model: "claude-sonnet-5",
    max_tokens: 8192,
    // Sonnet 5 runs adaptive thinking by default when `thinking` is omitted;
    // disabled here so output starts with the text block and max_tokens goes
    // entirely to the briefing JSON.
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: `Here are today's raw news items about Claude. Categorize, group, and summarize them into a daily briefing.\n\n${itemsSummary}`,
      },
    ],
    system: SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: BRIEFING_SCHEMA } },
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error(`Summarize response had no text block: ${JSON.stringify(response.content)}`);
  }
  const parsed = JSON.parse(textBlock.text);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  return {
    date: dateStr,
    generated_at: now.toISOString(),
    digest: parsed.digest,
    tabs: parsed.tabs,
  };
}
