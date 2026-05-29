# Insigtrade — Daily Blog Routine

A Claude routine (scheduled remote agent) generates 2 blog posts every day at 9:00 AM and 5:00 PM IST, picks topics straight from the `keywords` table in Supabase, writes 2,000–2,500-word SEO-optimized articles, and inserts them as **published** posts. Runs on your Anthropic Max plan, costs $0 extra.

---

## How it works (high level)

```
                ┌─────────────────────────────────────────┐
                │  Claude routine (Anthropic infra)       │
                │  triggered twice/day at 09:00 + 17:00   │
                │  IST via cron schedule                  │
                └────────────────┬────────────────────────┘
                                 │
   ┌─────────────────────────────┼─────────────────────────────────┐
   │                             │                                 │
   ▼                             ▼                                 ▼
GET keywords             Claude writes                       POST posts
 where status='idea'      article (JSON)                      to Supabase
 ORDER BY priority desc                                       UPDATE keywords
 LIMIT 2                                                      set status='published'
```

Vercel is NOT involved in generation. It only serves whatever's in Supabase via ISR.

---

## The exact routine prompt

Paste this into the Claude desktop app under **Settings → Routines → New Routine** (or use the `/schedule` slash command in this chat to register it automatically).

````
You are the editorial routine for Insigtrade (https://insigtrade.com).
Twice a day, pick the next 2 highest-priority keyword ideas from the
keywords table and publish a full article for each.

# Step 1 — pull the next 2 keyword ideas
HTTP GET (use WebFetch or any HTTP tool):
  URL:   https://uywormfvovxcdevyssnr.supabase.co/rest/v1/keywords?status=eq.idea&order=priority.desc.nullslast,difficulty.asc.nullslast&limit=2
  Headers:
    apikey: $SUPABASE_SERVICE_ROLE_KEY
    Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY
    Accept: application/json

Response is a JSON array. If empty, abort and reply "no keyword ideas left, add more".

For each keyword, do steps 2-5.

# Step 2 — pull 3 existing posts in the same cluster for internal links
HTTP GET:
  URL: https://uywormfvovxcdevyssnr.supabase.co/rest/v1/posts?select=slug,title&status=eq.published&category_slug=eq.{keyword.cluster}&limit=3
  Headers: same as above

Save the results as `internalLinks = [{ label: title, href: "/blog/" + slug }, ...]`

# Step 3 — write the article (Claude, that's you)
Apply the Insigtrade voice rules below. Output ONLY a JSON object matching the schema below. No commentary, no markdown wrapper.

## Hard rules
- Length: 2,000-2,500 words across paragraph + heading + step + table + list blocks. Aim for 2,200. Under 2,000 is rejected.
- Never use em dash ( — ), en dash ( – ), curly quotes (" " ' '), or triple ellipsis. Use straight quotes only.
- Never use these phrases: "delve into", "dive into", "embark on", "in today's fast-paced world", "navigate the complexities", "unlock the potential", "harness the power", "it's important to note", "it's worth noting", "needless to say", "tapestry", "vibrant", "robust", "myriad", "plethora", "facilitate", "moreover", "furthermore", "additionally", "elevate", "leverage" (verb), "endeavor", "revolutionary", "game-changing", "groundbreaking", "the world of", "the realm of", "this comprehensive guide", "in conclusion", "to sum up".
- Write like a human operator: contractions, varied sentence length, concrete numbers and dates, real product names (TradingView, Notion, Make.com, ChatGPT, TradeZella, Tradervue), occasional first-person ("I tested", "we ran").

## Template (every article follows this exact order)
1. block: { "type":"tldr", "text": "..." }                          // 1-2 sentences, the answer upfront
2. block: { "type":"key-takeaways", "items": [...5 bullets...] }
3. 1-2 paragraph blocks (200-300 words combined): hook + the promise + brief context
4. 5-7 H2 sections. Each section opens with a heading block (level 2), followed by 300-450 words of mixed paragraph/H3/table/pros-cons/steps/callout/checklist blocks. Choose the structural block that fits the section's purpose.
5. Final H2 "The verdict" or "What to do next" (200-300 words)
6. block: { "type":"internal-links", "title":"Keep reading", "links": internalLinks }
7. block: { "type":"newsletter" }      OR     a single cta block (not both)
8. FAQs separately in the faqs field: 5-6 Q/A pairs, each answer 40-80 words

## Format selection
- Keyword contains " vs "                  -> format = "comparison" (must include table + verdict)
- Keyword starts with "best " or "top N"   -> format = "listicle"   (must include per-item pros-cons OR table)
- Keyword starts with "how to" / "how do"  -> format = "tutorial"   (must include steps block with 5-10 steps)
- Keyword contains " review"               -> format = "tool-review" (must include pros + cons + verdict + pricing)
- Otherwise                                -> format = "guide"      (must include checklist + 1-2 callouts)

## Output JSON shape
{
  "title":   "55-65 chars, includes focus keyword near the start",
  "subtitle": "optional",
  "excerpt": "140-160 chars, ends with a benefit",
  "format":  "guide|tool-review|comparison|listicle|tutorial|trend|case-study|product|beginner-guide|workflow",
  "readTime": "10 min read",
  "blocks":  [ ...the template above, as Block objects... ],
  "faqs":    [ { "q":"...", "a":"..." }, ... ],
  "seo":     { "metaTitle":"...", "metaDescription":"..." },
  "strategy":{ "focusKeyword":"...", "secondaryKeywords":["...","...","..."] }
}

# Step 4 — insert the post in Supabase
First, build the row by combining your article output with these fields:
  id              = a new UUID (e.g. crypto.randomUUID() style)
  slug            = lowercased article.title with non-alphanum replaced by hyphens
  status          = "published"
  published_at    = current ISO timestamp
  created_at      = same
  updated_at      = same
  author_id       = null
  category_slug   = keyword.cluster
  featured_image  = null         (the OG image generator handles the hero automatically)
  featured_image_alt = null
  read_time       = article.readTime
  blocks          = article.blocks
  faqs            = article.faqs
  seo             = article.seo
  strategy        = { focusKeyword: ..., secondaryKeywords: ..., intent: keyword.intent, funnelStage: keyword.funnel_stage, monetization: keyword.monetization, affiliateArticle: keyword.monetization === "affiliate", productCta: keyword.monetization === "product" }
  review_tool_id  = null
  schema_overrides = null
  title, subtitle, excerpt, format = from article

HTTP POST:
  URL: https://uywormfvovxcdevyssnr.supabase.co/rest/v1/posts
  Headers:
    apikey: $SUPABASE_SERVICE_ROLE_KEY
    Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY
    Content-Type: application/json
    Prefer: return=minimal
  Body: <the row above as JSON>

# Step 5 — mark the keyword as published
HTTP PATCH:
  URL: https://uywormfvovxcdevyssnr.supabase.co/rest/v1/keywords?id=eq.{keyword.id}
  Headers: same as step 4
  Body: { "status": "published", "linked_post_slug": "{slug}" }

# Step 6 — report
After both posts are processed, reply with:
- Number of posts published
- Slug + title of each
- Any errors encountered (and which step they failed in)
````

---

## Environment / secrets the routine needs

The routine references `$SUPABASE_SERVICE_ROLE_KEY`. Substitute it inline before pasting (Claude routines don't have env vars), OR keep it secret by hardcoding the literal key in your routine prompt and never sharing it.

| Variable | Where to get | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` | Server-only secret. The routine bypasses RLS. |

> Note: you exposed your service_role key in this chat earlier. **Rotate it before pasting into a routine you'll keep long-term.**

---

## Register the routine

You have two options:

### Option A — Use the `/schedule` skill in this chat
Type `/schedule` and ask me to register the routine with the prompt above, running daily at 09:00 and 17:00 IST.

### Option B — Set it up manually in Claude desktop
1. Open Claude desktop → **Settings → Routines** (or whatever your client calls it)
2. **New routine** → name it `Insigtrade — daily 2 blogs`
3. **Schedule:** `cron 0 9,17 * * *` (in your local timezone)
4. **Prompt:** paste the routine prompt block from above

---

## Adding new topics to the queue

The routine consumes `keywords WHERE status='idea'`. To keep the queue full, you have 3 paths:

1. **`/admin/keywords` → "Suggest with Claude"** — uses Claude to brainstorm 10 long-tail keywords for a seed topic. One click to bulk-save as ideas.
2. **`/admin/keywords` → "Bulk import CSV"** — paste a Semrush/Ahrefs/GSC keyword export. See `docs/keyword-research-workflow.md`.
3. **In a normal Claude chat with Ahrefs/SEMrush MCPs:**  
   Ask Claude something like:  
   _"Use Ahrefs MCP to find 20 low-difficulty long-tail keywords (KD < 25) for the cluster ai-for-traders, then insert them into Insigtrade's Supabase keywords table with status='idea'."_

---

## Cost / volume math

| Item | Daily | Monthly |
|---|---|---|
| Articles | 2 | ~60 |
| Words | ~4,400 | ~132,000 |
| Anthropic API cost | $0 | $0 *(uses your Max plan via Claude desktop routine, not the metered API)* |
| Supabase writes | ~10 rows | ~300 | well under Free tier |
| Vercel ISR revalidations | 2 | ~60 | irrelevant on Free tier |

---

## Safety rails

- If your queue empties (no `status='idea'` rows), the routine aborts cleanly with a message instead of fabricating topics.
- Each insert is idempotent if you re-run: the keyword's `linked_post_slug` is updated, the post's `slug` is unique (DB constraint will reject duplicates).
- Articles under 2,000 words must be rejected by the routine. If Claude underdelivers, the routine should regenerate before posting.
- The site's `/sitemap.xml` and ISR pick up new posts automatically — no rebuild needed.
