import { RawItem } from "./types";
import { getRedditOAuthToken, fetchRedditUrl } from "./reddit-auth";
import fs from "fs";
import path from "path";

export type TipSource = {
  url: string;
  author: { name: string; role: string };
};

const CLAUDE_AI_AUTHOR = {
  name: "Community",
  role: "r/ClaudeAI contributors",
};
const LOCAL_LLAMA_AUTHOR = {
  name: "Community",
  role: "r/LocalLLaMA contributors",
};
const CURSOR_AUTHOR = { name: "Community", role: "r/cursor contributors" };

export const TIP_SEARCH_PATHS: { path: string; author: TipSource["author"] }[] =
  [
    // r/ClaudeAI — broad tip/workflow searches
    {
      path: "/r/ClaudeAI/search?q=tip+OR+trick+OR+workflow+OR+technique+OR+hack&restrict_sr=1&sort=top&t=week&limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    {
      path: "/r/ClaudeAI/search?q=CLAUDE.md+OR+%22custom+instructions%22+OR+%22system+prompt%22&restrict_sr=1&sort=top&t=week&limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    {
      path: "/r/ClaudeAI/search?q=MCP+OR+hooks+OR+memory+OR+config+OR+setup&restrict_sr=1&sort=top&t=week&limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    {
      path: "/r/ClaudeAI/search?q=slash+command+OR+%2Finit+OR+%2Fcompact+OR+%2Freview+OR+%2Fcommit&restrict_sr=1&sort=top&t=week&limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    {
      path: "/r/ClaudeAI/search?q=agent+OR+subagent+OR+agentic+OR+multi-agent&restrict_sr=1&sort=top&t=week&limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    {
      path: "/r/ClaudeAI/search?q=%22how+I%22+OR+%22how+to%22+OR+%22pro+tip%22+OR+PSA+OR+TIL&restrict_sr=1&sort=top&t=week&limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    // r/ClaudeAI — hot posts (catches tips that don't match keyword searches)
    {
      path: "/r/ClaudeAI/hot?limit=25",
      author: CLAUDE_AI_AUTHOR,
    },
    // r/LocalLLaMA — Claude-specific tips
    {
      path: "/r/LocalLLaMA/search?q=claude+tip+OR+claude+workflow+OR+claude+trick+OR+claude+code+setup&restrict_sr=1&sort=top&t=week&limit=25",
      author: LOCAL_LLAMA_AUTHOR,
    },
    // r/cursor — developer workflow overlap
    {
      path: "/r/cursor/search?q=claude+OR+anthropic+OR+sonnet+OR+opus&restrict_sr=1&sort=top&t=week&limit=25",
      author: CURSOR_AUTHOR,
    },
    // r/CodingWithAI
    {
      path: "/r/CodingWithAI/search?q=claude+OR+anthropic&restrict_sr=1&sort=top&t=week&limit=25",
      author: { name: "Community", role: "r/CodingWithAI contributors" },
    },
  ];

const MIN_SCORE = 2;
const DEDUP_WINDOW_DAYS = 30;

type StoredTip = {
  id: string;
  created_at?: string;
  sources: { url: string }[];
};

export function getExistingSourceUrls(): Set<string> {
  try {
    const tipsPath = path.join(process.cwd(), "data", "tips.json");
    const data = JSON.parse(fs.readFileSync(tipsPath, "utf-8"));
    const tips: StoredTip[] = data.tips ?? [];

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - DEDUP_WINDOW_DAYS);

    return new Set(
      tips
        .filter((t) => {
          if (!t.created_at) return true;
          return new Date(t.created_at) > cutoff;
        })
        .flatMap((t) => t.sources.map((s) => s.url)),
    );
  } catch {
    return new Set();
  }
}

export async function fetchTipSources(): Promise<
  { item: RawItem; author: { name: string; role: string } }[]
> {
  const existingUrls = getExistingSourceUrls();
  const results: { item: RawItem; author: { name: string; role: string } }[] =
    [];
  const seenUrls = new Set<string>();

  const token = await getRedditOAuthToken();
  if (token) {
    console.log("  Tips: using Reddit OAuth API");
  } else {
    console.log("  Tips: using Reddit public API");
  }

  for (const entry of TIP_SEARCH_PATHS) {
    try {
      const items = await fetchRedditUrl(entry.path, token);

      for (const item of items) {
        if (
          existingUrls.has(item.url) ||
          seenUrls.has(item.url) ||
          (item.score ?? 0) < MIN_SCORE
        ) {
          continue;
        }
        seenUrls.add(item.url);

        results.push({
          item,
          author: entry.author,
        });
      }
    } catch (error) {
      console.error("Failed to fetch Reddit tips:", error);
    }
  }

  return results;
}
