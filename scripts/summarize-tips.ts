import Anthropic from "@anthropic-ai/sdk";
import { RawItem } from "./sources/types";
import { Story } from "../src/types/daily";

const SYSTEM_PROMPT = `You extract actionable tips from raw content about Claude AI and Claude Code.

You will receive a numbered list of items. A single item (e.g. a changelog entry) may describe several distinct actionable changes — extract a separate tip for each one, all tagged with that item's number.

For each valid tip, output:
{
  "source_index": <the item's number from the list, e.g. 3>,
  "headline": "Imperative headline — 'Use X to do Y' or 'Configure X for better Y'",
  "summary": "2-3 sentences explaining why this matters and what it does",
  "actionable_steps": ["Step 1...", "Step 2...", "Step 3..."],
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimated_minutes": number
}

Rules:
- Headlines must be imperative ("Use...", "Set up...", "Configure...")
- 2-4 actionable steps, each a concrete instruction
- Skip anything without a clear "do this" takeaway — opinions, complaints, and vague discussion don't count
- No marketing fluff, no vague advice like "experiment more"
- difficulty: "beginner" = anyone can do it, "intermediate" = needs some CLI/config familiarity, "advanced" = requires deep tooling knowledge
- estimated_minutes: rough time to implement the tip (e.g., 2, 5, 15, 30)
- source_index must always match a real item number from the input list — never invent one and never point at a different item than the one the tip's content actually came from

Output a JSON array of tip objects only. Omit items with no actionable tip entirely — do not emit null placeholders for them.
Example: [{"source_index": 1, "headline": "...", "summary": "...", "actionable_steps": [...], "difficulty": "beginner", "estimated_minutes": 5}, {"source_index": 1, "headline": "...", "summary": "...", "actionable_steps": [...], "difficulty": "beginner", "estimated_minutes": 5}, {"source_index": 4, "headline": "...", "summary": "...", "actionable_steps": [...], "difficulty": "intermediate", "estimated_minutes": 10}]`;

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
    model: "claude-sonnet-5",
    max_tokens: 8192,
    thinking: { type: "disabled" },
    messages: [
      {
        role: "user",
        content: `Extract actionable tips from these items:\n\n${itemsText}`,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock?.type === "text" ? textBlock.text : "[]";
  const text = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  const parsed: {
    source_index: number;
    headline: string;
    summary: string;
    actionable_steps: string[];
    difficulty?: "beginner" | "intermediate" | "advanced";
    estimated_minutes?: number;
  }[] = JSON.parse(text);

  const tips: Story[] = [];
  const now = new Date().toISOString();
  let count = 0;

  for (const result of parsed) {
    const input = inputs[result.source_index - 1];
    if (!input) continue;
    count++;

    tips.push({
      id: `tip-${now.split("T")[0]}-${count}`,
      headline: result.headline,
      summary: result.summary,
      actionable_steps: result.actionable_steps,
      difficulty: result.difficulty,
      estimated_minutes: result.estimated_minutes,
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
  }

  return tips;
}
