# Phase 3 — Architecture, Schema, Monetization & Deployment

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js 16, App Router, RSC)                  │
│  ── Static-generated public pages (ISR-enabled)          │
│  ── Dynamic admin (server-rendered, auth-gated)          │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────┐
│  Server Layer                                             │
│  ── Server Actions (POST/PUT/DELETE writes)               │
│  ── lib/cms/store.ts  (file CMS read/write)               │
│  ── lib/cms/auth.ts   (cookie-based admin gate)           │
│  ── lib/seo + lib/schema (dynamic JSON-LD)                │
└────────────────────────────┬─────────────────────────────┘
                             │
┌────────────────────────────┴─────────────────────────────┐
│  Storage: /content/*.json (Git-versioned)                 │
│   posts/   categories/   tags/   tools/                   │
│   keywords/  authors/    testimonials/                    │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Automation Layer (npm scripts + cron)                   │
│  ── npm run seed                ← starter content        │
│  ── npm run generate            ← bulk draft creation    │
│  ── npm run publish-scheduled   ← promote scheduled→pub  │
│  ── npm run build:full          ← scheduled + build      │
└─────────────────────────────────────────────────────────┘
```

**Why file-based JSON (not Postgres)?**
- Zero deployment friction — works on Vercel/Netlify/any host
- Content is Git-versioned (every edit = a commit if you want)
- Builds are deterministic, ISR-safe
- Easy migration path to a database later (the entity types in `src/lib/cms/types.ts` map 1:1 to SQL tables)
- Works completely offline

## 2. Data Model (entities → file paths)

| Entity | File pattern | Type |
|---|---|---|
| Post | `content/posts/{slug}.json` | `Post` |
| Category | `content/categories/{slug}.json` | `Category` |
| Tag | `content/tags/{slug}.json` | `Tag` |
| Author | `content/authors/{id}.json` | `Author` |
| Tool | `content/tools/{id}.json` | `Tool` |
| Keyword | `content/keywords/{id}.json` | `Keyword` |
| Testimonial | `content/testimonials/{id}.json` | `Testimonial` |

All types live in `src/lib/cms/types.ts` (single source of truth).

## 3. Frontend Routes

| Route | Type | Revalidate | Notes |
|---|---|---|---|
| `/` | Static + ISR | 10 min | Hero, featured guides, tools, topics, trending, testimonials |
| `/blog` | Static + ISR | 10 min | Search via `?search=`, filter by `?category=` / `?tag=` |
| `/blog/[slug]` | SSG | 1 hour | Dynamic block renderer + JSON-LD |
| `/category/[slug]` | SSG | 30 min | Pillar pages + FAQ |
| `/tag/[slug]` | SSG | 30 min | Tag archive |
| `/reviews` | Static + ISR | 30 min | Tool catalog |
| `/reviews/[slug]` | SSG | 1 hour | Tool review + SoftwareApplication schema |
| `/about`, `/contact`, `/products` | Static | — | Brand pages |
| `/sitemap.xml` | Static | — | Auto-generated from CMS |
| `/robots.txt` | Static | — | Disallows /admin and /api |
| `/admin/*` | Dynamic | — | Cookie-gated |

## 4. Dynamic Article Engine

`src/components/blocks/BlockRenderer.tsx` is the core. Posts are stored as a polymorphic `blocks: Block[]` array. The renderer maps each block type to a presentational component.

**Supported block types** (20+):
`paragraph`, `heading`, `image`, `quote`, `callout` (info/warning/success/tip), `checklist`, `cta`, `tool-card`, `table`, `comparison`, `pros-cons`, `faq`, `code`, `video`, `internal-links`, `newsletter`, `testimonial`, `key-takeaways`, `tldr`, `steps`.

**How layout becomes "dynamic per article":**
The post's `format` (e.g. `tutorial`, `comparison`, `tool-review`) is set in the editor. Each format guides which blocks are included. The renderer **only renders blocks that exist** — so a comparison post automatically gets a comparison table + verdict + FAQ, while a tutorial gets steps + checklists. There's no fixed template.

The bulk generator (`scripts/generate-articles.mjs`) seeds the right block types based on the keyword's pattern (`how to` → tutorial steps, ` vs ` → comparison table, `best ` → listicle, etc.).

## 5. SEO System

**Per-post:**
- Title, meta description, canonical, robots
- OG title/description/image, Twitter card
- JSON-LD: `BlogPosting` (or `Review` for tool-reviews) + `BreadcrumbList` + `FAQPage` (only when FAQs exist)
- Auto TOC from H2 headings (only renders if 3+ exist)
- Internal-links block + related posts (same category)

**Site-wide:**
- `Organization` + `WebSite` schemas on home
- Auto sitemap from all CMS entities
- Robots.txt protects /admin
- All metadata routed through `src/lib/seo/metadata.ts`

**Schema rules (enforced):**
- `clean()` helper in `src/lib/schema/jsonld.ts` strips empty arrays/objects/null
- Schemas only emit when their required field exists (e.g. no FAQPage if `faqs.length === 0`)

## 6. Admin Panel

| Route | Capability |
|---|---|
| `/admin/login` | Cookie auth, env-driven password |
| `/admin` | Dashboard: post counts, SEO health audit, keyword pipeline |
| `/admin/posts` | List, edit, delete |
| `/admin/posts/new` | Full editor (content blocks + SEO + strategy tabs) |
| `/admin/posts/[slug]` | Edit existing |
| `/admin/keywords` | Quick add + table view + status pipeline |
| `/admin/tools` | Add/edit affiliate-ready tool entries |
| `/admin/categories` | CRUD + per-category SEO |

**Auth:**
- Single password via `ADMIN_PASSWORD` env var
- Default: `insigtrade-admin-2026`
- HttpOnly cookie, 30-day TTL
- All admin pages call `requireAuth()` — unauthed → 307 redirect to `/admin/login`
- robots.txt + per-page noindex prevent search indexing

## 7. Monetization Hooks

**Affiliate-ready:**
- Tool entries have `affiliateUrl` field (preferred over `website` when set)
- All affiliate links auto-render with `rel="noopener nofollow sponsored"`
- Posts flagged `strategy.affiliateArticle = true` auto-render disclosure
- `tool-card` and `cta` blocks accept affiliate URLs

**AdSense / Display ad zones (drop-in slots prepared):**
- After Hero (Home)
- Sidebar (Blog list page)
- Between every Nth paragraph block (extend BlockRenderer with an "after-paragraph" injector — 5 lines of code)
- Sticky mobile footer (add `<MobileAdSlot />` to `layout.tsx`)
- After post body, before related posts

To add ad code, edit `BlockRenderer` to inject `<AdSlot />` after every 3rd paragraph for posts > 800 words.

**Digital products:**
- `/products` page is wired and ready to render store entries when added
- Add a `Product` entity in `lib/cms/types.ts` + a `content/products/` directory + a CRUD page (~30 minutes)

## 8. Automation Workflow

### A. Content velocity loop

```
1. Add keywords to /admin/keywords  (or import from docs/02-KEYWORD-PLAN.md)
2. npm run generate -- --count 10           ← creates 10 drafts
3. Refine drafts in /admin/posts            ← edit blocks, add real screenshots
4. Set status=scheduled with publishedAt    ← or just mark published
5. cron → npm run publish-scheduled         ← runs hourly to promote
```

### B. Bulk generation flags

```bash
# Generate 5 drafts as 'draft' (default)
npm run generate -- --count 5

# Generate 10 articles only from one cluster
npm run generate -- --count 10 --cluster ai-for-traders

# Generate 20 drafts and schedule them 2 days apart (publishes over 40 days)
npm run generate -- --count 20 --status scheduled --space 2

# With LLM expansion (set OPENAI_API_KEY first)
OPENAI_API_KEY=sk-... npm run generate -- --count 5
```

### C. Cron setup (production)

```bash
# Crontab — promote scheduled posts hourly
0 * * * * cd /path/to/insigtrade && /usr/local/bin/npm run publish-scheduled

# Or Vercel cron (vercel.json):
{
  "crons": [{ "path": "/api/cron/publish-scheduled", "schedule": "0 * * * *" }]
}
```

## 9. Analytics / Tracking (ready to wire)

In `src/app/layout.tsx`, add (paste after the closing `</body>` placeholder):

```tsx
{process.env.NEXT_PUBLIC_GA_ID && (
  <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
)}
```

Same pattern for Search Console verification, Meta Pixel, etc. — env-driven.

## 10. Deployment

### Vercel (recommended)
```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init insigtrade"
git remote add origin git@github.com:youruser/insigtrade.git
git push -u origin main

# 2. Import in vercel.com
# 3. Add env vars:
#    NEXT_PUBLIC_SITE_URL=https://insigtrade.com
#    ADMIN_PASSWORD=<your-strong-password>
#    OPENAI_API_KEY=<optional, for LLM article gen>
# 4. Add cron:
```

`vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/publish-scheduled", "schedule": "0 * * * *" }
  ]
}
```

### Self-hosted (any VPS)
```bash
npm install --omit=dev
npm run build
NEXT_PUBLIC_SITE_URL=https://your.com ADMIN_PASSWORD=xxx npm start
# Add a systemd timer or crontab entry for publish-scheduled
```

## 11. Future Scale Roadmap

| Phase | When | Add |
|---|---|---|
| **M0–M3** | At launch | Current setup. Run `npm run generate`, publish 3/week. |
| **M3–M6** | At ~30 posts | Add Postgres (Supabase) — swap `store.ts` implementations, types stay identical. Add comments, webhooks for Slack notifications on new posts. |
| **M6–M9** | At ~10k pageviews/mo | Apply for display ad network (Ezoic/Mediavine equivalent). Wire `<AdSlot />` into BlockRenderer. Add Search Console API integration to surface "almost-ranking" posts in admin. |
| **M9–M12** | At ~25k pv/mo | Launch first digital product (prompt pack). Add Stripe checkout. Newsletter migration to Beehiiv/Substack. |
| **Y2** | At ~100k pv/mo | Add multi-author roles. Sponsored review workflow. Course platform. Community gating. |

---

## 12. Quick Reference

**Default admin password:** `insigtrade-admin-2026` (override with `ADMIN_PASSWORD` env)

**npm scripts:**
- `npm run dev` — local development
- `npm run build` — production build
- `npm run seed` — load starter content (idempotent)
- `npm run generate -- --count 5` — bulk article drafts
- `npm run publish-scheduled` — cron entrypoint
- `npm run build:full` — runs scheduler + build

**Content directories:**
- `content/posts/*.json` — every post
- `content/keywords/*.json` — keyword planner data
- `content/tools/*.json` — affiliate tool entries
- `content/categories/*.json` — pillar topic clusters
- `content/tags/*.json`, `content/authors/*.json`, `content/testimonials/*.json`

**Edit content via admin** at `/admin/login` — never edit JSON files manually unless you know what you're doing (admin saves with auto-revalidation).
