# Claude Daily Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a once-daily AI-generated news briefing for the Claude ecosystem — three tabs (Claude.ai, Claude Code, Cowork) with summarized stories from Anthropic blog and Reddit.

**Architecture:** Next.js App Router with ISR reads daily JSON files from `/data/`. A standalone generation script (run via GitHub Actions cron) fetches sources, calls Claude API to summarize, and commits JSON to the repo. Vercel auto-deploys.

**Tech Stack:** Next.js 14+ (App Router), TypeScript, Tailwind CSS 4, Claude API (Anthropic SDK), GitHub Actions

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: Create Next.js app with Tailwind**

Run:
```bash
cd ~/claude-daily
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --use-npm
```

Accept overwrite prompts. This scaffolds the full project.

**Step 2: Update `src/app/globals.css` with Claude palette**

Replace contents with:
```css
@import "tailwindcss";

@theme {
  --color-cream: #FAF6F1;
  --color-cream-dark: #F0EBE3;
  --color-claude-orange: #E07A3A;
  --color-claude-orange-hover: #C96A2F;
  --color-charcoal: #1A1A1A;
  --color-gray-secondary: #6B6B6B;
  --color-card-shadow: rgba(139, 109, 79, 0.08);
  --font-serif: "Georgia", "Times New Roman", serif;
}
```

**Step 3: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Daily",
  description: "Your daily briefing on everything Claude",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-charcoal antialiased">{children}</body>
    </html>
  );
}
```

**Step 4: Update `src/app/page.tsx` with placeholder**

```tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-claude-orange">Claude Daily</h1>
    </main>
  );
}
```

**Step 5: Verify it runs**

Run: `cd ~/claude-daily && npm run dev`
Expected: App runs on localhost:3000, shows "Claude Daily" in orange on cream background.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Claude color palette"
```

---

### Task 2: Define TypeScript Types

**Files:**
- Create: `src/types/daily.ts`

**Step 1: Create type definitions**

```typescript
export type SourceType = "blog" | "reddit" | "twitter";

export type Source = {
  type: SourceType;
  title: string;
  url: string;
  published_at: string;
};

export type Story = {
  id: string;
  headline: string;
  summary: string;
  key_points?: string[];
  sources: Source[];
  perspectives?: string;
};

export type Tab = {
  label: string;
  stories: Story[];
};

export type TabKey = "claude_ai" | "claude_code" | "cowork";

export type DailyBriefing = {
  date: string;
  generated_at: string;
  tabs: Record<TabKey, Tab>;
};
```

**Step 2: Commit**

```bash
git add src/types/daily.ts
git commit -m "feat: add TypeScript types for daily briefing data model"
```

---

### Task 3: Create Sample Data

**Files:**
- Create: `data/sample.json`

**Step 1: Write realistic sample data**

Create `data/sample.json` with a full `DailyBriefing` object. Include:
- 3 stories under `claude_ai` (model updates, pricing, features)
- 3 stories under `claude_code` (CLI updates, new commands, workflows)
- 2 stories under `cowork` (collaboration features, team use cases)

Each story should have realistic headlines, 2-3 sentence summaries, 2-3 key points, 1-2 sources with plausible URLs, and perspectives on at least one story per tab.

Use today's date. Make the content feel real — not "Lorem ipsum" but actual plausible Claude news.

**Step 2: Commit**

```bash
git add data/sample.json
git commit -m "feat: add sample briefing data for development"
```

---

### Task 4: Build Top Bar Component

**Files:**
- Create: `src/components/TopBar.tsx`

**Step 1: Build the component**

```tsx
type TopBarProps = {
  date: string;
  availableDates: string[];
  onDateChange: (date: string) => void;
};

export function TopBar({ date, availableDates, onDateChange }: TopBarProps) {
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  return (
    <header className="sticky top-0 z-10 bg-cream border-b border-cream-dark">
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-charcoal tracking-tight">
            Claude Daily
          </h1>
          <p className="text-sm text-gray-secondary mt-0.5">
            Your daily Claude ecosystem briefing
          </p>
        </div>
        <select
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="bg-white border border-cream-dark rounded-lg px-3 py-1.5 text-sm text-charcoal cursor-pointer hover:border-claude-orange transition-colors"
        >
          {availableDates.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/TopBar.tsx
git commit -m "feat: add TopBar component with date selector"
```

---

### Task 5: Build Tab Bar Component

**Files:**
- Create: `src/components/TabBar.tsx`

**Step 1: Build the component**

```tsx
import { TabKey } from "@/types/daily";

const TAB_CONFIG: { key: TabKey; label: string }[] = [
  { key: "claude_ai", label: "Claude.ai" },
  { key: "claude_code", label: "Claude Code" },
  { key: "cowork", label: "Cowork" },
];

type TabBarProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  storyCounts: Record<TabKey, number>;
};

export function TabBar({ activeTab, onTabChange, storyCounts }: TabBarProps) {
  return (
    <nav className="sticky top-[73px] z-10 bg-cream border-b border-cream-dark">
      <div className="max-w-3xl mx-auto px-4 flex gap-0">
        {TAB_CONFIG.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === key
                ? "text-claude-orange"
                : "text-gray-secondary hover:text-charcoal"
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs text-gray-secondary">
              {storyCounts[key]}
            </span>
            {activeTab === key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-claude-orange" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/TabBar.tsx
git commit -m "feat: add TabBar component with active state and story counts"
```

---

### Task 6: Build Story Card Component

**Files:**
- Create: `src/components/StoryCard.tsx`
- Create: `src/components/SourcePill.tsx`

**Step 1: Build SourcePill**

```tsx
import { SourceType } from "@/types/daily";

const SOURCE_CONFIG: Record<SourceType, { label: string; icon: string }> = {
  blog: { label: "Blog", icon: "📝" },
  reddit: { label: "Reddit", icon: "💬" },
  twitter: { label: "X", icon: "𝕏" },
};

type SourcePillProps = {
  type: SourceType;
  url: string;
};

export function SourcePill({ type, url }: SourcePillProps) {
  const config = SOURCE_CONFIG[type];

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-cream-dark text-gray-secondary hover:text-claude-orange hover:bg-cream transition-colors"
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </a>
  );
}
```

**Step 2: Build StoryCard**

```tsx
import { Story } from "@/types/daily";
import { SourcePill } from "./SourcePill";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "yesterday";
  return `${diffD}d ago`;
}

type StoryCardProps = {
  story: Story;
};

export function StoryCard({ story }: StoryCardProps) {
  const earliestSource = story.sources.reduce((earliest, s) =>
    s.published_at < earliest.published_at ? s : earliest
  );

  return (
    <article className="py-5 border-b border-cream-dark last:border-b-0">
      <h2 className="text-base font-semibold text-charcoal leading-snug">
        {story.headline}
      </h2>

      <p className="mt-2 text-sm text-gray-secondary leading-relaxed">
        {story.summary}
      </p>

      {story.key_points && story.key_points.length > 0 && (
        <ul className="mt-2.5 space-y-1">
          {story.key_points.map((point, i) => (
            <li
              key={i}
              className="text-sm text-charcoal flex items-start gap-2"
            >
              <span className="text-claude-orange mt-1 text-xs">●</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      )}

      {story.perspectives && (
        <p className="mt-2.5 text-sm italic text-gray-secondary border-l-2 border-claude-orange pl-3">
          {story.perspectives}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        {story.sources.map((source, i) => (
          <SourcePill key={i} type={source.type} url={source.url} />
        ))}
        <span className="text-xs text-gray-secondary ml-auto">
          {timeAgo(earliestSource.published_at)}
        </span>
      </div>
    </article>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/SourcePill.tsx src/components/StoryCard.tsx
git commit -m "feat: add StoryCard and SourcePill components"
```

---

### Task 7: Wire Up Main Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/lib/data.ts`
- Create: `src/components/BriefingView.tsx`

**Step 1: Create data loading utility**

Create `src/lib/data.ts`:

```typescript
import { DailyBriefing } from "@/types/daily";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export function getAvailableDates(): string[] {
  if (!fs.existsSync(DATA_DIR)) return [];

  return fs
    .readdirSync(DATA_DIR)
    .filter((f) => f.endsWith(".json") && f !== "sample.json")
    .map((f) => f.replace(".json", ""))
    .sort()
    .reverse();
}

export function getBriefing(date?: string): DailyBriefing | null {
  const dates = getAvailableDates();

  const targetDate = date || dates[0];
  if (!targetDate) {
    // Fall back to sample data
    const samplePath = path.join(DATA_DIR, "sample.json");
    if (fs.existsSync(samplePath)) {
      return JSON.parse(fs.readFileSync(samplePath, "utf-8"));
    }
    return null;
  }

  const filePath = path.join(DATA_DIR, `${targetDate}.json`);
  if (!fs.existsSync(filePath)) return null;

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
```

**Step 2: Create BriefingView client component**

Create `src/components/BriefingView.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DailyBriefing, TabKey } from "@/types/daily";
import { TopBar } from "./TopBar";
import { TabBar } from "./TabBar";
import { StoryCard } from "./StoryCard";

type BriefingViewProps = {
  briefing: DailyBriefing;
  availableDates: string[];
};

export function BriefingView({ briefing, availableDates }: BriefingViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("claude_ai");
  const router = useRouter();

  const dates =
    availableDates.length > 0 ? availableDates : [briefing.date];

  const storyCounts: Record<TabKey, number> = {
    claude_ai: briefing.tabs.claude_ai.stories.length,
    claude_code: briefing.tabs.claude_code.stories.length,
    cowork: briefing.tabs.cowork.stories.length,
  };

  const activeStories = briefing.tabs[activeTab].stories;

  return (
    <div className="min-h-screen bg-cream">
      <TopBar
        date={briefing.date}
        availableDates={dates}
        onDateChange={(date) => router.push(`/?date=${date}`)}
      />
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        storyCounts={storyCounts}
      />
      <main className="max-w-3xl mx-auto px-4 py-2">
        {activeStories.length === 0 ? (
          <p className="py-12 text-center text-gray-secondary">
            No stories in this category today.
          </p>
        ) : (
          activeStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))
        )}
      </main>
      <footer className="max-w-3xl mx-auto px-4 py-8 text-center text-xs text-gray-secondary">
        Generated {new Date(briefing.generated_at).toLocaleString()} · Powered
        by Claude
      </footer>
    </div>
  );
}
```

**Step 3: Update main page**

Replace `src/app/page.tsx`:

```tsx
import { getBriefing, getAvailableDates } from "@/lib/data";
import { BriefingView } from "@/components/BriefingView";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const briefing = getBriefing(params.date);
  const availableDates = getAvailableDates();

  if (!briefing) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-secondary">No briefing available yet.</p>
      </main>
    );
  }

  return <BriefingView briefing={briefing} availableDates={availableDates} />;
}
```

**Step 4: Verify it runs**

Run: `npm run dev`
Expected: Full UI with TopBar, three tabs, story cards rendering from sample data. Orange accent colors on cream background. Tabs switch and show different stories.

**Step 5: Commit**

```bash
git add src/lib/data.ts src/app/page.tsx src/components/BriefingView.tsx
git commit -m "feat: wire up main page with data loading and BriefingView"
```

---

### Task 8: Build Generation Pipeline — Source Fetchers

**Files:**
- Create: `scripts/sources/types.ts`
- Create: `scripts/sources/anthropic-blog.ts`
- Create: `scripts/sources/reddit.ts`

**Step 1: Define raw source item type**

Create `scripts/sources/types.ts`:

```typescript
export type RawItem = {
  title: string;
  url: string;
  content: string;
  source_type: "blog" | "reddit";
  published_at: string;
  score?: number;
};
```

**Step 2: Build Anthropic blog fetcher**

Create `scripts/sources/anthropic-blog.ts`:

```typescript
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
      const pubDate =
        itemXml.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || "";

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
```

**Step 3: Build Reddit fetcher**

Create `scripts/sources/reddit.ts`:

```typescript
import { RawItem } from "./types";

const SUBREDDIT_URL =
  "https://www.reddit.com/r/ClaudeAI/new.json?limit=50";

export async function fetchReddit(): Promise<RawItem[]> {
  try {
    const response = await fetch(SUBREDDIT_URL, {
      headers: { "User-Agent": "ClaudeDaily/1.0" },
    });
    const data = await response.json();

    return data.data.children
      .filter((child: any) => child.data.score > 0)
      .map((child: any) => ({
        title: child.data.title,
        url: `https://reddit.com${child.data.permalink}`,
        content: child.data.selftext || child.data.title,
        source_type: "reddit" as const,
        published_at: new Date(
          child.data.created_utc * 1000
        ).toISOString(),
        score: child.data.score,
      }));
  } catch (error) {
    console.error("Failed to fetch Reddit:", error);
    return [];
  }
}
```

**Step 4: Commit**

```bash
git add scripts/
git commit -m "feat: add source fetchers for Anthropic blog and Reddit"
```

---

### Task 9: Build Generation Pipeline — Filter and Summarize

**Files:**
- Create: `scripts/filter.ts`
- Create: `scripts/summarize.ts`

**Step 1: Build filter**

Create `scripts/filter.ts`:

```typescript
import { RawItem } from "./sources/types";

export function filterItems(
  items: RawItem[],
  hoursBack: number = 24
): RawItem[] {
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - hoursBack);

  const seen = new Set<string>();

  return items
    .filter((item) => {
      const publishedAt = new Date(item.published_at);
      if (publishedAt < cutoff) return false;

      if (seen.has(item.url)) return false;
      seen.add(item.url);

      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.published_at).getTime() -
        new Date(a.published_at).getTime()
    );
}
```

**Step 2: Build summarizer**

Create `scripts/summarize.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { RawItem } from "./sources/types";
import { DailyBriefing } from "../src/types/daily";

const SYSTEM_PROMPT = `You are a news editor for "Claude Daily", a daily briefing about the Claude AI ecosystem.

You receive raw news items from various sources. Your job is to:

1. Categorize each item into one of three tabs:
   - claude_ai: Claude.ai product updates, model releases, features, pricing, general Anthropic news
   - claude_code: Claude Code CLI, SDK updates, developer tooling, coding workflows
   - cowork: Cowork collaboration features, team usage, enterprise features

2. Group related items into single stories (e.g., a blog post and Reddit discussion about the same announcement)

3. For each story, generate:
   - A clear, concise headline (newspaper style, not clickbait)
   - A 2-3 sentence summary synthesizing all sources
   - Key points (only for stories that warrant them, 2-3 bullets max)
   - Perspectives (only when sources disagree or there is genuine nuance)

4. Include 5-10 stories per tab. If a tab has fewer items, that is fine.

5. If an item does not clearly fit Claude ecosystem news, discard it.

Output ONLY valid JSON matching this exact schema:
{
  "tabs": {
    "claude_ai": {
      "label": "Claude.ai",
      "stories": [{ "id": "claude-ai-001", "headline": "", "summary": "", "key_points": [], "sources": [{ "type": "blog|reddit|twitter", "title": "", "url": "", "published_at": "" }], "perspectives": "" }]
    },
    "claude_code": { "label": "Claude Code", "stories": [...] },
    "cowork": { "label": "Cowork", "stories": [...] }
  }
}`;

export async function summarize(
  items: RawItem[]
): Promise<DailyBriefing> {
  const client = new Anthropic();

  const itemsSummary = items
    .map(
      (item, i) =>
        `[${i + 1}] Source: ${item.source_type} | Score: ${item.score ?? "N/A"}
Title: ${item.title}
URL: ${item.url}
Published: ${item.published_at}
Content: ${item.content.slice(0, 500)}`
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

  const text =
    response.content[0].type === "text"
      ? response.content[0].text
      : "";
  const parsed = JSON.parse(text);

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  return {
    date: dateStr,
    generated_at: now.toISOString(),
    tabs: parsed.tabs,
  };
}
```

**Step 3: Commit**

```bash
git add scripts/filter.ts scripts/summarize.ts
git commit -m "feat: add filter and Claude API summarization pipeline"
```

---

### Task 10: Build Main Generate Script

**Files:**
- Create: `scripts/generate.ts`
- Modify: `package.json` (add script)

**Step 1: Install dependencies**

Run:
```bash
cd ~/claude-daily && npm install @anthropic-ai/sdk && npm install -D tsx
```

**Step 2: Build orchestrator**

Create `scripts/generate.ts`:

```typescript
import { fetchAnthropicBlog } from "./sources/anthropic-blog";
import { fetchReddit } from "./sources/reddit";
import { filterItems } from "./filter";
import { summarize } from "./summarize";
import fs from "fs";
import path from "path";

async function main() {
  console.log("Fetching sources...");

  const [blogItems, redditItems] = await Promise.all([
    fetchAnthropicBlog(),
    fetchReddit(),
  ]);

  console.log(`  Blog: ${blogItems.length} items`);
  console.log(`  Reddit: ${redditItems.length} items`);

  const allItems = [...blogItems, ...redditItems];
  const filtered = filterItems(allItems);

  console.log(`  After filtering: ${filtered.length} items`);

  if (filtered.length === 0) {
    console.log("No items found. Generating placeholder...");
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    const placeholder = {
      date: dateStr,
      generated_at: now.toISOString(),
      tabs: {
        claude_ai: { label: "Claude.ai", stories: [] },
        claude_code: { label: "Claude Code", stories: [] },
        cowork: { label: "Cowork", stories: [] },
      },
    };
    writeOutput(dateStr, placeholder);
    return;
  }

  console.log("Summarizing with Claude...");
  const briefing = await summarize(filtered);

  writeOutput(briefing.date, briefing);
  console.log("Done!");
}

function writeOutput(date: string, data: unknown) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, `${date}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`  Written to ${filePath}`);
}

main().catch((error) => {
  console.error("Generation failed:", error);
  process.exit(1);
});
```

**Step 3: Add script to `package.json`**

Add to the `"scripts"` section:
```json
"generate": "tsx scripts/generate.ts"
```

**Step 4: Test the script manually**

Run: `ANTHROPIC_API_KEY=your-key npm run generate`
Expected: Fetches sources, filters, calls Claude, writes JSON to `data/YYYY-MM-DD.json`.

**Step 5: Commit**

```bash
git add scripts/generate.ts package.json package-lock.json
git commit -m "feat: add main generation script orchestrating fetch, filter, summarize"
```

---

### Task 11: GitHub Actions Cron Job

**Files:**
- Create: `.github/workflows/generate.yml`

**Step 1: Create the workflow**

```yaml
name: Generate Daily Briefing

on:
  schedule:
    - cron: "0 12 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Generate briefing
        run: npm run generate
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

      - name: Commit and push
        run: |
          git config user.name "Claude Daily Bot"
          git config user.email "bot@claudedaily.dev"
          git add data/
          if git diff --staged --quiet; then
            echo "No new data to commit"
          else
            DATE=$(date -u +%Y-%m-%d)
            git commit -m "data: daily briefing $DATE"
            git push
          fi
```

**Step 2: Commit**

```bash
git add .github/workflows/generate.yml
git commit -m "feat: add GitHub Actions cron job for daily generation"
```

---

### Task 12: Final Polish and Deploy

**Files:**
- Verify: `next.config.ts`
- Verify: `.gitignore`

**Step 1: Verify `.gitignore`**

Ensure `.gitignore` has `node_modules/`, `.next/`, `.env`, `.env.local` but does NOT ignore `data/`.

**Step 2: Final visual check**

Run: `npm run dev`
Verify:
- Cream background, orange accents match Claude brand
- Tabs switch smoothly with story counts
- Story cards are tight and information-dense
- Source pills link out correctly
- Date selector works
- Mobile responsive (resize browser to narrow width)
- Footer shows generation time

**Step 3: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: final polish, deployment ready"
```

---

## Deployment Checklist

After all tasks are complete:

1. Create GitHub repo and push
2. Add `ANTHROPIC_API_KEY` to GitHub repo secrets
3. Connect repo to Vercel
4. Trigger manual workflow run to generate first briefing
5. Verify the deployed site loads with real data
