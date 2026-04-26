# Workflow — Semrush + Claude Code (no API key needed)

Your stack:
- **Semrush** (paid, real keyword data) — does the discovery
- **Claude Code** (Max plan, this terminal) — does the writing
- **Insigtrade admin UI** — stores keywords + posts, browser preview

This is a perfectly viable production workflow. You publish 3-5 posts per week without paying for the Anthropic API.

---

## The 4-step loop (repeats weekly)

```
┌─ 1. RESEARCH ──────────┐    ┌─ 2. IMPORT ──────────┐
│ Semrush Keyword Magic  │ ─► │ Paste CSV into       │
│ → export 50-200 ideas  │    │ /admin/keywords      │
└────────────────────────┘    │ → all become "idea"  │
                              └──────────┬───────────┘
                                         │
┌─ 4. PUBLISH ────────────┐   ┌─ 3. WRITE ─────────────┐
│ Edit drafts in /admin   │ ◄─┤ In Claude Code:        │
│ → status: published     │   │ "write a post for kw X"│
│ → git push → live       │   │ I write to             │
└─────────────────────────┘   │ content/posts/X.json   │
                              └────────────────────────┘
```

---

## Step 1 — Semrush keyword discovery (every Monday morning, ~30 min)

### What to pull
Open Semrush → **Keyword Magic Tool** → run these 5 seed searches (one per cluster):

| Cluster | Seed search | Filter |
|---|---|---|
| AI for traders | `chatgpt traders` | KD < 30, Volume > 100 |
| Trading automation | `automate trading` | KD < 30, Volume > 100 |
| Trader productivity | `trading journal` | KD < 30, Volume > 100 |
| Market research | `stock screener` | KD < 30, Volume > 100 |
| Wealth systems | `ai for solopreneurs` | KD < 25, Volume > 50 |

For each: filter by **Intent** (mix all four), sort by **KD ascending**, grab the top 30-50 results.

### Export
- Click **Export → CSV (semicolon)**
- Open the file, copy all rows including header

### Tip — also grab "Questions" tab
Inside Semrush, switch to the **Questions** sub-tab in Keyword Magic. These are gold for tutorials and FAQ-rich posts. Export separately.

### Tip — competitor gap analysis
- Semrush → **Keyword Gap** → enter `tradervue.com`, `babypips.com`, `benzinga.com` as competitors against `insigtrade.com`
- Look for keywords where competitors rank but you don't (yet)
- Filter to KD < 25, "Missing" or "Weak" position
- These are your easiest wins

---

## Step 2 — Import into the planner (~2 min)

1. Go to `/admin/keywords`
2. Click **Import CSV** (top right)
3. Optionally pick a default cluster (e.g. "AI for Traders" if all your keywords from this batch are that cluster)
4. Paste the Semrush CSV
5. Click **Import keywords**

The importer auto-detects:
- Delimiter: comma / tab / semicolon
- Columns: `keyword`, `volume`, `kd`, `intent`, `cluster`
- Duplicates: skips any keyword already in your planner
- Priority: high if KD ≤ 18, medium if KD ≤ 30, else low

You'll see a green banner: *"Imported 47 keywords — skipped 3 duplicates."*

---

## Step 3 — Generate the post (in Claude Code — me!)

Pick the keyword you want to write about. Tell me:

> *"Write a blog post for the keyword 'how to automate trading alerts to discord' — Semrush says vol 880, KD 16, informational intent. Save it to content/posts/."*

I'll:
1. Pick the right format (tutorial here — the "how to" pattern)
2. Write the full post using Insigtrade voice (pragmatic, plain-spoken, real tool names)
3. Build the structured `Post` JSON: TL;DR + key takeaways + heading hierarchy + steps block + FAQ + SEO meta + focus keyword + secondary keywords + JSON-LD-ready fields
4. Write it to `content/posts/{slug}.json` directly
5. Update the keyword's status to `writing` and link the post slug

Then it shows up in `/admin/posts` as a draft, ready to refine.

### Batch mode (faster)

Tell me the top 5 keywords from your Semrush import, and I'll generate all 5 posts in sequence. Example:

> *"Generate posts for these 5 keywords:*
> *1. how to use perplexity for stock research (vol 320, KD 9, info)*
> *2. tradervue vs edgewonk (vol 320, KD 17, comparison)*
> *3. best ai stock screeners (vol 720, KD 24, commercial)*
> *4. zapier for traders (vol 320, KD 14, info)*
> *5. notion template for traders (vol 590, KD 14, commercial)*
>
> *Save all to content/posts/ and update the keywords to status='writing'."*

I'll write all 5 in one session. Takes ~3-5 minutes.

### Even faster — tell me the cluster, I pick the keywords

> *"Look at content/keywords/, pick the 5 best 'idea' keywords from the AI-for-traders cluster, write all 5 posts."*

I'll read your planner, prioritize by (KD ascending × volume descending × commercial intent), and write them.

---

## Step 4 — Polish + publish (~10 min per post)

1. Open `/admin/posts` in browser → click the new draft
2. Read it end-to-end — anything off about the brand voice, refine
3. Add a real screenshot or two (the dynamic block renderer supports `image` blocks — paste a URL)
4. Set status to **Published** → save
5. When you have 3-5 ready: `git add content/ && git commit -m "publish: 5 new posts" && git push`
6. Vercel auto-deploys in ~90 seconds → live + indexed

---

## Recommended weekly cadence

| Day | Task | Time |
|---|---|---|
| Mon | Semrush research → import 30-50 keywords | 30 min |
| Mon-Tue | I generate 5 posts via Claude Code | 30 min back-and-forth |
| Tue-Thu | You polish + add screenshots | 1 hr/post |
| Fri | Push 3-5 posts to Vercel | 5 min |
| Sat | Submit new URLs to Google Search Console | 5 min |

Net: **3-5 high-quality posts/week, $0 in API costs.**

---

## Things I can do for you in this terminal (free under your Max plan)

| Ask me to... | Example |
|---|---|
| Pick best keywords from your planner | *"Show me the top 10 unwritten keywords ranked by opportunity score"* |
| Write a single post | *"Write a post for 'tradervue vs edgewonk', save to content/posts/"* |
| Write a batch | *"Write posts for the 5 highest-priority idea keywords"* |
| Cluster analysis | *"Look at content/keywords/, group them into 3-post mini-series I should write together"* |
| Internal link audit | *"Look at all my published posts and tell me which ones should link to each other"* |
| Update an existing post | *"Open content/posts/chatgpt-prompts-for-traders.json, add a new section on Custom GPTs"* |
| Refresh stale posts | *"Find posts published 6+ months ago, suggest what's outdated"* |
| Generate FAQ for a post | *"Add 3 more FAQs to the 'best AI tools' post targeting People Also Ask"* |
| Topic gap analysis | *"What topics are missing from my AI-for-traders cluster?"* |
| Pillar post outline | *"Outline a 4000-word pillar post on 'AI for Traders 2026'"* |

---

## When you'd actually want to add the API key later

This manual workflow is ideal for:
- Months 1-6 (low volume, you're learning what ranks)
- 3-5 posts/week
- Hands-on quality control on every post

You'd switch to API-keyed automation when:
- You're publishing 10+ posts/week
- You've hired a writer who needs to use the admin UI without your laptop
- You want fully scheduled, hands-off bulk generation
- The blog is making $50+/month so $5-10/mo in API costs is irrelevant

Until then: Semrush + Claude Code + git push is the right call.
