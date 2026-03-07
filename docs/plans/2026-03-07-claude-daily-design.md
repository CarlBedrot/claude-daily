# Claude Daily — Design Document

**Date:** 2026-03-07
**Status:** Approved

## Product Concept

Claude Daily is a once-daily AI-generated briefing covering everything happening in the Claude ecosystem. Three tabs: **Claude.ai**, **Claude Code**, **Cowork**. Each tab contains 5-10 summarized stories synthesized from multiple sources. Generated at noon UTC via a GitHub Action cron job. Built with Next.js, hosted on Vercel.

Target audience: developers building with Claude and power users who use Claude daily for work.

One daily update. Five minutes to read. No infinite scroll, no ads, no attention games.

## Sources (v1)

- **Anthropic blog** — RSS feed for official announcements, model releases, research
- **Reddit r/ClaudeAI** — JSON API (`/r/ClaudeAI/new.json?limit=50`) for community discussion, tips, issues

**Fast-follow (v2):** X/Twitter via scraping service or SocialData API.

## Architecture

```
GitHub Action (cron, noon UTC)
  → Fetch sources (RSS, Reddit JSON API)
  → Filter last 24h, deduplicate, discard low-signal
  → Claude API (Sonnet): categorize, group, summarize
  → Output /data/YYYY-MM-DD.json
  → Commit to repo
  → Vercel auto-deploys via ISR
```

**Key decisions:**
- JSON committed to repo (simple, free, version-controlled)
- ISR on Vercel — regenerates when new JSON lands, cached otherwise
- No database — JSON files are the data layer
- Claude Sonnet for summarization (fast, cheap)

## Data Model

```json
{
  "date": "2026-03-07",
  "generated_at": "2026-03-07T12:00:00Z",
  "tabs": {
    "claude_ai": {
      "label": "Claude.ai",
      "stories": [
        {
          "id": "claude-ai-001",
          "headline": "Story headline",
          "summary": "2-3 sentence summary",
          "key_points": ["point 1", "point 2"],
          "sources": [
            {
              "type": "blog | reddit | twitter",
              "title": "Source title",
              "url": "https://...",
              "published_at": "2026-03-07T08:00:00Z"
            }
          ],
          "perspectives": "Optional — only when genuine disagreement exists"
        }
      ]
    },
    "claude_code": { "label": "Claude Code", "stories": [] },
    "cowork": { "label": "Cowork", "stories": [] }
  }
}
```

**Rules:**
- Stories with multiple sources get merged into one entry
- 5-10 stories per tab max
- `key_points` optional — skip for smaller stories
- `perspectives` only when there's genuine disagreement or nuance

## UI Design

**Palette:**
- Background: warm cream `#FAF6F1`
- Cards: white `#FFFFFF` with subtle warm shadow
- Primary accent: Claude orange `#E07A3A`
- Text: deep charcoal `#1A1A1A`, secondary `#6B6B6B`
- Links/sources: muted orange on hover

**Layout:**
- Top bar: logo ("Claude Daily") left, date selector right
- Tab bar: three tabs, sticky, active = orange underline + bold
- Story cards: tight vertical stack
  - Headline (bold, 1-2 lines)
  - Summary (2-3 sentences)
  - Key points (optional bullet list)
  - Source pills (small rounded tags: Reddit, Blog, Twitter)
  - Time context ("12h ago")
- No images — text-first
- Subtle dividers between cards

**Design references:** Kagi News (clean tabs, curated feel) + X/Twitter (information density, tight cards) + newspaper hierarchy.

**Mobile:** Single column, horizontally scrollable tabs, cards stack naturally.

## Generation Pipeline

1. **Fetch** — Anthropic blog RSS + Reddit r/ClaudeAI JSON API
2. **Filter** — Last 24h only, deduplicate by URL, discard Reddit posts with 0 upvotes
3. **Categorize & Summarize** — Single Claude API call with all filtered content. Prompt instructs Claude to categorize into tabs, group related items, generate structured JSON
4. **Commit & Deploy** — Write JSON to `/data/YYYY-MM-DD.json`, commit, Vercel auto-deploys

**Fallbacks:**
- Source down → skip it, don't fail the run
- Claude API fails → retry once, then GitHub Action notification
- Zero stories → "No major updates today" placeholder

## Tech Stack

- **Framework:** Next.js (App Router, ISR)
- **AI:** Claude API (Sonnet) for summarization
- **Automation:** GitHub Actions (daily cron)
- **Hosting:** Vercel
- **Data:** JSON files in repo

## Scope

**In v1:**
- Daily generation from 2 sources
- 3 tabs with 5-10 stories each
- Past editions browsable via date picker
- Static JSON, no user accounts

**Not in v1:**
- X/Twitter integration
- User accounts / personalization
- Notifications
- Content filtering / reading level
- Custom categories
