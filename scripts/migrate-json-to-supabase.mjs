#!/usr/bin/env node
// One-off migration: copy every JSON file in /content into Supabase.
// Idempotent — uses upsert so re-running is safe.
//
// Usage:  node scripts/migrate-json-to-supabase.mjs
// Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from .env.local.

import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT = path.join(ROOT, "content");

// Load .env.local manually (no dotenv dependency)
async function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  try {
    const raw = await fs.readFile(envPath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
      if (!m) continue;
      const [, k, v] = m;
      if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, "");
    }
  } catch {}
}

await loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function readJsonDir(dir) {
  try {
    const files = await fs.readdir(dir);
    const out = [];
    for (const f of files) {
      if (!f.endsWith(".json")) continue;
      const raw = await fs.readFile(path.join(dir, f), "utf8");
      out.push(JSON.parse(raw));
    }
    return out;
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

function ok(name, { error, count }) {
  if (error) {
    console.error(`✗ ${name}: ${error.message}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${name}: ${count} row(s)`);
  }
}

// ─── Categories ─────────────────────────────────────────
{
  const items = await readJsonDir(path.join(CONTENT, "categories"));
  const rows = items.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description ?? "",
    seo_title: c.seoTitle ?? null,
    seo_description: c.seoDescription ?? null,
    faqs: c.faqs ?? [],
    pillar_post_slug: c.pillarPostSlug ?? null,
  }));
  const { error } = await sb.from("categories").upsert(rows, { onConflict: "slug" });
  ok("categories", { error, count: rows.length });
}

// ─── Tags ───────────────────────────────────────────────
{
  const items = await readJsonDir(path.join(CONTENT, "tags"));
  const rows = items.map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description ?? null,
  }));
  const { error } = await sb.from("tags").upsert(rows, { onConflict: "slug" });
  ok("tags", { error, count: rows.length });
}

// ─── Tools ──────────────────────────────────────────────
{
  const items = await readJsonDir(path.join(CONTENT, "tools"));
  const rows = items.map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    tagline: t.tagline ?? "",
    description: t.description ?? "",
    category: t.category ?? "",
    logo: t.logo ?? null,
    website: t.website ?? "",
    affiliate_url: t.affiliateUrl ?? null,
    pricing: t.pricing ?? "",
    rating: t.rating ?? 0,
    features: t.features ?? [],
    pros: t.pros ?? [],
    cons: t.cons ?? [],
    use_cases: t.useCases ?? [],
    verdict: t.verdict ?? null,
    badge: t.badge ?? null,
  }));
  const { error } = await sb.from("tools").upsert(rows, { onConflict: "id" });
  ok("tools", { error, count: rows.length });
}

// ─── Posts (and post_tags link table) ───────────────────
{
  const items = await readJsonDir(path.join(CONTENT, "posts"));
  const rows = items.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? null,
    excerpt: p.excerpt ?? "",
    format: p.format,
    status: p.status,
    published_at: p.publishedAt ?? null,
    scheduled_for: p.scheduledFor ?? null,
    created_at: p.createdAt ?? new Date().toISOString(),
    updated_at: p.updatedAt ?? new Date().toISOString(),
    author_id: null, // single "team" author handled by app default
    category_slug: p.categorySlug || null,
    featured_image: p.featuredImage ?? null,
    featured_image_alt: p.featuredImageAlt ?? null,
    read_time: p.readTime ?? null,
    blocks: p.blocks ?? [],
    faqs: p.faqs ?? [],
    seo: p.seo ?? null,
    strategy: p.strategy ?? null,
    review_tool_id: p.reviewToolId || null,
    schema_overrides: p.schemaOverrides ?? null,
  }));
  const { error } = await sb.from("posts").upsert(rows, { onConflict: "id" });
  ok("posts", { error, count: rows.length });

  // Rebuild post_tags link rows
  if (!error) {
    const allLinks = [];
    for (const p of items) {
      for (const slug of p.tagSlugs ?? []) {
        allLinks.push({ post_id: p.id, tag_slug: slug });
      }
    }
    if (allLinks.length) {
      // Drop existing links for these posts then insert fresh
      const ids = items.map((p) => p.id);
      await sb.from("post_tags").delete().in("post_id", ids);
      const { error: linkErr } = await sb.from("post_tags").insert(allLinks);
      ok("post_tags", { error: linkErr, count: allLinks.length });
    }
  }
}

// ─── Keywords ───────────────────────────────────────────
{
  const items = await readJsonDir(path.join(CONTENT, "keywords"));
  const rows = items
    // Map any non-uuid ids (k1, k2 etc.) to deterministic uuids so we don't
    // duplicate on re-runs. We use a v5-like approach via crypto.
    .map((k) => ({
      // Re-generate id if the existing one isn't a uuid
      id: /^[0-9a-f]{8}-/.test(k.id) ? k.id : crypto.randomUUID(),
      keyword: k.keyword,
      volume: k.volume ?? null,
      difficulty: k.difficulty ?? null,
      intent: k.intent ?? null,
      cluster: k.cluster ?? null,
      funnel_stage: k.funnelStage ?? null,
      priority: k.priority ?? null,
      suggested_title: k.suggestedTitle ?? null,
      competitor_urls: k.competitorUrls ?? [],
      monetization: k.monetization ?? null,
      status: k.status ?? "idea",
      linked_post_slug: k.linkedPostSlug ?? null,
    }));
  // Upsert on (lower(keyword)) — since the unique index is on lower(keyword),
  // we manually de-dupe by deleting any pre-existing row with the same keyword.
  if (rows.length) {
    const keywords = rows.map((r) => r.keyword);
    await sb.from("keywords").delete().in("keyword", keywords);
    const { error } = await sb.from("keywords").insert(rows);
    ok("keywords", { error, count: rows.length });
  } else {
    console.log("✓ keywords: 0 row(s)");
  }
}

// ─── Testimonials ───────────────────────────────────────
{
  const items = await readJsonDir(path.join(CONTENT, "testimonials"));
  const rows = items.map((t) => ({
    id: t.id,
    quote: t.quote,
    author: t.author,
    role: t.role ?? null,
    avatar: t.avatar ?? null,
  }));
  const { error } = await sb.from("testimonials").upsert(rows, { onConflict: "id" });
  ok("testimonials", { error, count: rows.length });
}

// ─── Schema config (singleton) ──────────────────────────
{
  try {
    const raw = await fs.readFile(path.join(CONTENT, "config", "schema.json"), "utf8");
    const cfg = JSON.parse(raw);
    const { error } = await sb.from("schema_config").upsert(
      {
        id: "global",
        organization: cfg.organization,
        website: cfg.website,
        default_author: cfg.defaultAuthor ?? null,
      },
      { onConflict: "id" }
    );
    ok("schema_config", { error, count: 1 });
  } catch (e) {
    if (e.code !== "ENOENT") console.error("schema_config:", e.message);
  }
}

console.log("\nMigration complete.");
