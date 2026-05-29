# Insigtrade — Keyword Research Workflow

The Insigtrade content engine consumes `keywords WHERE status='idea'` from Supabase. Whatever's in that queue gets turned into a blog post. This doc covers the 3 ways to put high-quality, low-competition topics in the queue.

---

## Quality bar for a keyword that should enter the queue

| Filter | Target | Why |
|---|---|---|
| Monthly volume | 100 – 5,000 | high enough to matter, low enough to not be impossible |
| KD (keyword difficulty) | < 25 | Insigtrade is a young domain; chase low-KD long-tail first |
| Intent | informational / commercial / comparison | transactional + navigational rarely fit our content style |
| Specificity | very specific | "stock screener" ❌ — "free stock screener for swing trading reddit" ✅ |
| Topical fit | matches one of the 5 clusters | otherwise the brand voice fights the topic |

Clusters live in the `categories` table:
- `ai-for-traders` — ChatGPT, Claude, Perplexity, AI tools for stock/crypto/forex
- `trading-automation` — Zapier, Make.com, n8n, broker APIs, webhooks, alerts
- `trader-productivity` — journals, Notion templates, workflow systems
- `market-research` — screeners, news APIs, earnings prep, sentiment
- `wealth-systems` — AI for solopreneurs, import-export intelligence, side-hustle systems

---

## Path 1 — Ask Claude with the Ahrefs MCP (best for ongoing research)

You have the Ahrefs MCP connected. In any Claude chat:

```
Use the Ahrefs MCP to find 20 long-tail keyword ideas for the cluster
"trading-automation" with:
  - KD between 0 and 22
  - Monthly volume between 150 and 4000
  - Informational or comparison intent
  - English (US/UK/CA/AU)

For each one return: keyword, volume, KD, intent, cluster, suggested
article title, and a 1-line rationale.

Then INSERT them into the Insigtrade Supabase keywords table with
status='idea'. Use the service_role key for the HTTP POST.
```

Useful Ahrefs MCP tools for this:
- `keywords-explorer-matching-terms` — find variations
- `keywords-explorer-related-terms` — find lateral topics
- `keywords-explorer-search-suggestions` — autocomplete-style
- `keywords-explorer-overview` — get volume/KD for specific keywords
- `serp-overview` — see who currently ranks for the term

---

## Path 2 — Bulk import a CSV (best after a Semrush / Ahrefs export)

1. In Semrush or Ahrefs, run "Keyword Magic" or "Keyword Explorer", apply filters (KD ≤ 25, volume 100-5000), export to CSV.
2. Open `/admin/keywords` on your site.
3. Find the "Bulk import" section (top of the page) and paste the CSV — headers and all.
4. The admin auto-detects:
   - delimiter (comma, tab, semicolon)
   - column headers (`keyword`, `volume`, `KD`/`difficulty`, `intent`, `cluster`)
5. New rows are added with `status='idea'`. Duplicates (same `keyword`, case-insensitive) are skipped.

Accepted column names (case-insensitive, partial match works):
- **keyword**: `keyword`, `query`, `phrase`
- **volume**: `volume`, `search volume`, `avg. monthly searches`, `impressions`
- **KD**: `kd`, `keyword difficulty`, `difficulty`, `competition`
- **intent**: `intent`, `search intent`
- **cluster**: `cluster`, `topic`, `category`, `group`

---

## Path 3 — Use the admin "Suggest with Claude" button (quick brainstorm)

1. Go to `/admin/keywords`
2. Enter a seed topic in the "Suggest with Claude" box (e.g. `automating earnings alerts to Discord`)
3. Optionally constrain cluster + intent
4. Click "Suggest"
5. Review the 10 ideas, click "Save all" to push them into the queue with `status='idea'`

Requires `ANTHROPIC_API_KEY` set in Vercel env vars if you want this from the admin UI. (Not needed for the daily routine.)

---

## Recommended cadence

| Frequency | Action | Target queue size |
|---|---|---|
| Once a week | Run Ahrefs MCP research (Path 1), add 14-20 new ideas | keep `status='idea'` count ≥ 30 |
| Monthly | Export a fresh Semrush keyword set, bulk-import (Path 2) | refill any cluster that's drying up |
| Daily | Routine consumes 2 ideas, marks them `published` | self-managing |

If the daily routine reports "no keyword ideas left", that's your signal to run Path 1 again.

---

## Tracking what's working

After 2-4 weeks of publishing, check which posts are getting impressions / clicks:

- **GSC MCP**: `gsc_get_top_queries` (and the `gsc-pages` Ahrefs equivalent) — see what the site is actually ranking for vs what you targeted
- **GA / Plausible**: see which posts have traffic, which bounce
- Mark high-performing topics' siblings as priority='high' in `/admin/keywords` so the routine picks them next
