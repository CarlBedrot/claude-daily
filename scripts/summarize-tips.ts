import Anthropic from "@anthropic-ai/sdk";
import { RawItem } from "./sources/types";
import { Story } from "../src/types/daily";

const SYSTEM_PROMPT = `You extract actionable tips from raw content about Claude AI and Claude Code.

For each item, decide:
- If it contains a concrete, actionable tip → extract it
- If it is just opinion, complaint, or vague discussion → discard it (return null)

For each valid tip, output:
{
  "headline": "Imperative headline — 'Use X to do Y' or 'Configure X for better Y'",
  "summary": "2-3 sentences explaining why this matters and what it does",
  "actionable_steps": ["Step 1...", "Step 2...", "Step 3..."]
}

Rules:
- Headlines must be imperative ("Use...", "Set up...", "Configure...")
- 2-4 actionable steps, each a concrete instruction
- Discard anything without a clear "do this" takeaway
- No marketing fluff, no vague advice like "experiment more"

Output a JSON array. Use null for items you discard.
Example: [{"headline": "...", "summary": "...", "actionable_steps": [...]}, null, {"headline": "...", ...}]`;

type TipInput = {
  item: RawItem;
  author: { name: string; role: string };
};

export async function summarizeTips(inputs: TipInput[]): Promise<Story[]> {
  if (inputs.length === 0) return [];

  const client = new Anthropic();

  const itemsText = inputs
    .map(
      (input, i) =>
        `[${i + 1}] Source: ${input.item.source_type} | Score: ${input.item.score ?? "N/A"}
Title: ${input.item.title}
URL: ${input.item.url}
Author: ${input.author.name} (${input.author.role})
Content: ${input.item.content.slice(0, 800)}`,
    )
    .join("\n\n---\n\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract actionable tips from these items:\n\n${itemsText}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "[]";
  const parsed: ({
    headline: string;
    summary: string;
    actionable_steps: string[];
  } | null)[] = JSON.parse(text);

  const tips: Story[] = [];
  const now = new Date().toISOString();

  parsed.forEach((result, i) => {
    if (!result) return;
    const input = inputs[i];

    tips.push({
      id: `tip-${now.split("T")[0]}-${i + 1}`,
      headline: result.headline,
      summary: result.summary,
      actionable_steps: result.actionable_steps,
      author: input.author,
      sources: [
        {
          type: input.item.source_type === "reddit" ? "reddit" : "blog",
          title: input.item.title,
          url: input.item.url,
          published_at: input.item.published_at,
        },
      ],
    });
  });

  return tips;
}
