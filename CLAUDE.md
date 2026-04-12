# Claude Daily

AI-generated daily briefing covering the Claude ecosystem. Fetches news from multiple sources, summarizes with Claude, outputs JSON data files, and serves a Next.js frontend.

## Quick Start

```bash
npm install
npm run dev          # Local dev server at localhost:3000
npm run generate     # Run the full generation pipeline (needs API keys)
npm run fetch-raw    # Fetch sources only, write to data/raw-latest.json
```

## Tech Stack

- **Next.js 16** (App Router) with React 19 and TypeScript (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/postcss` -- import with `@import "tailwindcss"` in CSS, not `@tailwind` directives
- **Anthropic SDK** (`@anthropic-ai/sdk`) for summarization -- uses `claude-sonnet-4-20250514`
- **Vercel Blob** (`@vercel/blob`) for audio file storage
- **ElevenLabs** for text-to-speech audio generation
- **tsx** for running TypeScript scripts directly

## Architecture

```
scripts/          Generation pipeline (runs via GitHub Action or locally)
  generate.ts       Main entry: fetch -> filter -> summarize -> audio -> write JSON
  summarize.ts      Claude API call for news categorization + summarization
  summarize-tips.ts Claude API call for extracting actionable tips
  generate-audio.ts Claude script generation + ElevenLabs TTS
  filter.ts         Time window (72h), dedup, recent-day exclusion
  fetch-raw.ts      Debug script: fetch sources, dump to raw-latest.json
  sources/          Individual source fetchers
    fetch-all.ts      Orchestrator -- runs all fetchers in parallel
    anthropic-blog.ts Anthropic blog RSS
    anthropic-docs.ts Anthropic docs pages
    claude-code-changelog.ts  Claude Code changelog
    reddit.ts         Reddit r/ClaudeAI (OAuth + public fallback)
    reddit-auth.ts    Reddit OAuth token management
    hackernews.ts     HN Algolia search API
    twitter.ts        Twitter/X API
    tip-registry.ts   Multi-subreddit tip search (r/ClaudeAI, r/LocalLLaMA, r/cursor, r/CodingWithAI)
    types.ts          RawItem type definition

src/
  app/
    page.tsx          Server component, reads JSON data, passes to BriefingView
    layout.tsx        Root layout with Source Serif 4 font, dark mode script, PWA meta
    globals.css       Tailwind + custom theme (light/dark CSS variables)
    api/
      audio/route.ts  On-demand per-story TTS via ElevenLabs, cached in Vercel Blob
      rss/route.ts    RSS feed of current briefing
      search/route.ts Full-text search across all historical briefings
  components/
    BriefingView.tsx  Main client component: tabs, navigation, keyboard shortcuts, reading state
    StoryCard.tsx     Expandable news story with sources, key points, impact
    TipCard.tsx       Expandable tip with actionable steps, difficulty, time estimate
    SearchOverlay.tsx Modal search with debounced API calls and highlight matching
    TabBar.tsx        Tab navigation with unread counts
    TopBar.tsx        Date display and date picker
    AudioPlayer.tsx   Daily audio briefing player
    DigestBanner.tsx  Daily digest/lead story banner
    CatchUpBanner.tsx Missed days notification
    QuietDayBanner.tsx Low-story-count fallback
    SourceList.tsx    Source pill badges
    SourceItem.tsx    Individual source link with favicon
    FootnoteText.tsx  Inline [N] footnote reference rendering
    StoryAudioButton.tsx Per-story audio generation button
  lib/
    data.ts           Data access layer -- reads JSON files from data/ directory
    format.ts         timeAgo(), extractDomain(), faviconUrl() utilities
    reading-state.ts  localStorage-based read/unread tracking
  types/
    daily.ts          Core type definitions: DailyBriefing, Story, Source, Tab, TabKey

data/               JSON data files (committed to repo, this IS the database)
  YYYY-MM-DD.json   Daily briefings
  tips.json         Cumulative tip archive
  raw-latest.json   Debug: last raw fetch output
  sample.json       Fallback data
```

## Data Model

The central type is `DailyBriefing` in `src/types/daily.ts`. Daily JSON files in `data/` contain:
- `date`, `generated_at`, optional `audio_url`
- `digest`: `{ lead, themes, summary }` -- the day's editorial summary
- `tabs`: `{ claude_ai, claude_code, community, tips }` -- each with label + stories array

Stories have: `id`, `headline`, `summary`, optional `key_points`, `sources` (with `[N]` inline references), optional `perspectives`, `impact`, `author`, `actionable_steps`, `difficulty`, `estimated_minutes`.

There is no database. JSON files committed to the repo are the data layer.

## Environment Variables

Required for generation (set in GitHub Actions secrets):
- `ANTHROPIC_API_KEY` -- Claude API for summarization
- `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` -- Reddit OAuth
- `TWITTER_BEARER_TOKEN` -- Twitter/X API

Optional:
- `ELEVENLABS_API_KEY` / `ELEVENLABS_VOICE_ID` -- Audio generation (skipped gracefully if absent)
- `BLOB_READ_WRITE_TOKEN` -- Vercel Blob storage for audio files
- `SITE_URL` -- Defaults to `https://claude-daily-one.vercel.app`

For Vercel deployment:
- `VERCEL_TOKEN` / `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`

No `.env.example` exists. All env vars are documented in `.github/workflows/generate.yml`.

## Deployment

- **Hosting:** Vercel with auto-deploy
- **CI:** GitHub Actions workflow (`.github/workflows/generate.yml`)
  - Runs daily at 07:00 UTC via cron + manual `workflow_dispatch`
  - Fetches sources, generates briefing, commits `data/` to main, deploys to Vercel
  - Bot commits as "Claude Daily Bot" with format `data: daily briefing YYYY-MM-DD`
- **ISR:** Page uses `revalidate = 3600` (1 hour cache)

## Conventions

- **TypeScript strict mode** enabled
- **Path aliases:** `@/*` maps to `./src/*`
- **Component pattern:** Server component (`page.tsx`) fetches data, passes to `"use client"` components
- **Styling:** Tailwind utility classes with custom theme colors defined as CSS variables in `globals.css`. Color names: `cream`, `cream-dark`, `claude-orange`, `charcoal`, `gray-secondary`
- **Dark mode:** CSS class-based (`.dark` on `<html>`), toggled via localStorage, theme vars swap in `globals.css`
- **Type definitions:** Use `type` keyword (not `interface`). Types live in `src/types/daily.ts`
- **No ESLint or Prettier config** -- relies on default Next.js behavior
- **No test framework** -- no tests exist in this project
- **Font:** Source Serif 4 (serif) via `next/font/google`, applied as CSS variable `--font-source-serif`

## Key Patterns

- **Inline source references:** Stories use `[N]` notation in text fields referencing the story's `sources` array (1-indexed). `FootnoteText` component renders these as clickable links.
- **Reading state:** `localStorage`-based tracking in `src/lib/reading-state.ts`. Tracks last visit date, read story IDs per date, and calculates unread counts.
- **Tip lifecycle:** New tips are extracted from news items via Claude, appended to `data/tips.json` archive. Daily briefings select 5 tips (new ones first, then random from archive, avoiding repeats within 7 days).
- **Deduplication:** `filter.ts` excludes URLs already used in the past 3 days of briefings. Tip registry deduplicates against a 30-day window.
- **Keyboard navigation:** Arrow left/right for date navigation, 1-4 for tab switching.
- **Error handling in generation:** Source fetch failures are non-fatal (individual sources skip gracefully). Audio generation failure is non-fatal. Zero items produces a placeholder briefing.

## Common Tasks

**Add a new source:** Create a fetcher in `scripts/sources/` returning `RawItem[]`, add it to `scripts/sources/fetch-all.ts`, add any new env vars to the GitHub Actions workflow.

**Modify the summarization prompt:** Edit the `SYSTEM_PROMPT` in `scripts/summarize.ts`. The prompt defines tab categorization rules, story structure, and the digest format.

**Add a new tab:** Update `TabKey` and `NEWS_TAB_KEYS` in `src/types/daily.ts`, update `ALL_TABS` in `BriefingView.tsx`, add keyboard shortcut, update the summarization prompt.

**Change the generation schedule:** Edit the cron expression in `.github/workflows/generate.yml`.
