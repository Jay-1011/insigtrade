# Insigtrade — Weekly Content Routine

**Goal:** 3 publishable posts per week, $0 in API costs, ~3 hours of your time.

---

## The 60-minute Monday session

This is the only "owned" time block. Everything else fits in micro-windows during the week.

### 0:00 — 0:10 — Trends scan (I drive)
Open Claude Code (this terminal) and say:

> *"Run the weekly Trends scan."*

I'll open Google Trends in your Chrome and check momentum on:
- Last week's published post topics (validate you picked right)
- The 5 cluster seeds (`ai trading tools`, `chatgpt trading`, `trading automation`, `trading journal`, `ai stock screener`)
- Any new product/tool searches you mention (e.g. "TrendSpider", "Unusual Whales")

I save findings to `docs/research/{date}-trends.md` and call out:
- Any keyword whose momentum changed (rising or falling)
- Breakout queries worth jumping on
- Tools to add to the planner

### 0:10 — 0:30 — Semrush pull (you drive, I receive)
Your job — I can't open Semrush. Run this exact sequence in your browser:

1. **Keyword Magic Tool** — search the seed Trends flagged this week. Filter: KD < 30, Volume > 100. Export CSV.
2. **Keyword Gap** (do once per month, not weekly) — your domain vs `tradezella.com`, `tradervue.com`, `babypips.com`. Filter: Missing/Weak position. Export CSV.
3. **Position Tracking** — paste in your top 20 published post URLs, sort by impressions delta. Note the 3 that gained the most + the 3 that lost the most.

Total time: ~20 minutes once you're used to it.

### 0:30 — 0:35 — Hand the data to me
Paste the CSVs into Claude Code:

> *"Here's this week's Semrush data. Process it."*
>
> *[paste CSV 1]*
> *[paste CSV 2]*

I'll run them through the bulk importer (`npm run` is not needed — I do it via the file system), dedupe against existing keywords, prioritize, and tell you the **top 5 to write this week**.

### 0:35 — 1:00 — I write 3 posts, you confirm picks
I propose: *"Top 3 to write this week, in this order:*
1. *[keyword 1] — listicle, MOFU, affiliate*
2. *[keyword 2] — tutorial, TOFU, newsletter magnet*
3. *[keyword 3] — comparison, BOFU, affiliate*

*Should I write all 3, or do you want to swap any?"*

You confirm/adjust. I write all 3 to `content/posts/` in this session. Each takes ~5 minutes.

**End of Monday session.** Your week is set up.

---

## Tuesday-Friday — micro-tasks (15-30 min each)

### Tuesday: Polish post 1
- Open `/admin/posts/{slug-1}` in browser
- Read end-to-end, make voice tweaks
- Add 1-2 real screenshots (TradeZella dashboard, Notion template, etc.)
- Status → `published` → save

### Wednesday: Polish post 2
- Same as Tuesday for post 2

### Thursday: Polish post 3 + commit + push
- Polish post 3
- `git add content/`
- `git commit -m "publish: 3 new posts (week of YYYY-MM-DD)"`
- `git push`
- Vercel auto-deploys (~90s)

### Friday: Index + measure (10 min)
- Open Google Search Console → Sitemaps → request reindex of new URLs
- Open GSC → Performance → look at last week's published posts → note impressions
- Tell me in Claude Code: *"Last week's posts now have X / Y / Z impressions in GSC"*
- I log it for next Monday's review

### Saturday + Sunday: optional
- Outreach (1-2 backlink emails to niche blogs)
- Reddit organic engagement (manual, on your account — answer questions in r/algotrading, r/Daytrading)
- Newsletter draft for the week's posts

---

## When you ask me anything during the week

These are my "always-available" capabilities — fire them anytime in Claude Code:

| Ask | What I do |
|---|---|
| *"What should I write tomorrow?"* | Read your planner, pick the top idea, write it |
| *"Research [topic] on Trends and tell me what's hot"* | Open Chrome, hit Google Trends, report signals |
| *"Add this keyword: [phrase]"* | Append to `content/keywords/` with sensible defaults |
| *"What's the strongest post I have for [keyword]?"* | Search content/posts/ and tell you |
| *"Refresh post [slug] — what's outdated?"* | Read the post, suggest specific updates |
| *"Process this Semrush CSV: [paste]"* | Run through bulk import logic, dedupe, prioritize |
| *"Pick 5 internal links for [post slug]"* | Read the corpus, suggest the highest-relevance internal links |
| *"Generate 3 FAQs targeting PAA for [keyword]"* | Write them and I can add to an existing post or use them in a new one |

---

## Monthly deep work (1-2 hours, last Sunday of each month)

### Content audit
> *"Run a content audit. Posts older than 90 days, ranked by GSC impressions delta over the last month."*

I'll surface:
- Posts gaining traction → refresh them with new data, add 1-2 new sections
- Posts that flopped → either kill them or rewrite the title/intro
- Posts that should link to each other but don't → add the internal links

### Cluster review
> *"Look at my 5 clusters. Which one is underweighted? Which keywords should I prioritize next month?"*

I'll cross-reference published count per cluster vs total opportunity (from `docs/02-KEYWORD-PLAN.md`) and tell you where to invest.

### Competitor check
> *"What's tradezella.com's blog publishing this month?"*

I can't browse their blog (Chrome MCP block) but I can suggest you spend 5 min checking + paste me their post titles. I'll find gap opportunities.

---

## What I genuinely cannot do (be honest)

- ❌ Browse Reddit, Hacker News, Wikipedia, search engines, Semrush — all blocked
- ❌ Auto-publish on a schedule without your involvement (no API key, no cron)
- ❌ Pull Google Search Console data without you logging in + manually reading the dashboard
- ❌ Run the workflow without you in the room — I can only respond when you talk to me

What I CAN do consistently:
- ✅ Drive Google Trends in your Chrome
- ✅ Process any data you paste at me
- ✅ Write publish-ready posts in 5-10 minutes each
- ✅ Maintain the content/ files (keywords, posts, tools, schema)
- ✅ Run Insigtrade build/test/deploy commands

---

## Goal: by end of Q3 2026

| Metric | Target | How |
|---|---|---|
| Published posts | 100+ | 3/week × 13 weeks × 3 quarters |
| Indexed posts | 80%+ of published | GSC submission discipline |
| Posts ranking page 1 | 5-10 | Cluster authority builds slowly |
| Monthly organic visitors | 3,000-8,000 | Long-tail compounding |
| Email subscribers | 500+ | Newsletter CTAs in every post |
| Affiliate revenue | $50-200/mo | TradeZella + Tradervue + TradingView |
| Display ad eligibility | Hit 10k pv/mo for Ezoic | M9-M12 |

If we hit even the low end of these, the blog is paying for itself within 12 months — at which point adding the API key for full automation becomes a no-brainer.

---

## TL;DR — the system in one sentence

**Every Monday: I Trends-scan → you Semrush-pull → I write 3 posts → you polish + push by Friday → repeat.**
