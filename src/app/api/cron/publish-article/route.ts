// POST /api/cron/publish-article
// Body: { keyword_id: string, article: GeneratedArticle, status?: 'published'|'draft'|'scheduled', scheduled_for?: ISO }
// Saves the article as a post (reusing the same articleToPost mapper the
// admin UI uses), then marks the keyword status='published' and
// linked_post_slug=<slug>. Idempotent on slug via the posts.slug unique
// index — re-running with the same article will fail at the slug check,
// which is fine (the routine handles errors).

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { db } from "@/lib/supabase/server";
import { articleToPost, type GeneratedArticle } from "@/lib/ai/claude";
import { savePost, saveKeyword, slugifyStr } from "@/lib/cms/store";
import type { Keyword } from "@/lib/cms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PublishBody {
  keyword_id: string;
  article: GeneratedArticle;
  status?: "published" | "draft" | "scheduled";
  scheduled_for?: string;
  /**
   * Optional hero image URL the routine generated (Higgsfield CDN URL).
   * The endpoint downloads it server-side, uploads to Supabase Storage,
   * and sets the post.featuredImage to the stable public Storage URL.
   * Without this, the post falls back to the dynamic OG image (which
   * has text), which looks like a placeholder in blog lists.
   */
  image_url?: string;
  image_alt?: string;
}

export async function POST(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  let body: PublishBody;
  try {
    body = (await req.json()) as PublishBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.keyword_id || !body?.article) {
    return Response.json(
      { error: "Missing keyword_id or article" },
      { status: 400 }
    );
  }
  const a = body.article;
  if (!a.title || !a.blocks || !Array.isArray(a.blocks)) {
    return Response.json(
      { error: "article must include title and blocks[]" },
      { status: 400 }
    );
  }

  // Normalize block shapes the routine sometimes drifts from. The DB stores
  // arbitrary jsonb, but the renderer expects canonical fields. Doing this
  // here means every saved post is renderer-safe.
  a.blocks = normalizeBlocks(a.blocks);

  // Hard quality gate: reject articles under 1,800 words (safety margin
  // below the 2,000 floor) so the routine retries instead of publishing
  // thin content.
  const wordCount = countArticleWords(a);
  if (wordCount < 1800) {
    return Response.json(
      {
        error: "Article rejected: under 1,800 words",
        wordCount,
        hint: "Regenerate with a longer body before publishing.",
      },
      { status: 422 }
    );
  }

  // Anti-AI-tell safety check
  const tellFlag = scanForAiTells(a);
  if (tellFlag) {
    return Response.json(
      {
        error: "Article rejected: contains banned content",
        offender: tellFlag,
        hint: "Regenerate with the banned-phrase rules applied.",
      },
      { status: 422 }
    );
  }

  // Fetch the keyword for context (cluster/intent/etc.)
  const { data: kwRow, error: kwErr } = await db()
    .from("keywords")
    .select("*")
    .eq("id", body.keyword_id)
    .maybeSingle();
  if (kwErr || !kwRow) {
    return Response.json(
      { error: "Keyword not found", id: body.keyword_id },
      { status: 404 }
    );
  }

  // Validate the keyword's cluster against the real categories table.
  // The routine sometimes shortens slugs (e.g. "automation" instead of
  // "trading-automation"), which violates the posts.category_slug FK.
  // We coerce common aliases to the canonical slug, and 422 on a true miss.
  const rawCluster = (kwRow.cluster as string | null) ?? "";
  const canonicalCluster = await resolveCategorySlug(rawCluster);
  if (rawCluster && !canonicalCluster) {
    const { data: cats } = await db().from("categories").select("slug");
    return Response.json(
      {
        error: `category_slug "${rawCluster}" not found in categories table`,
        hint:
          "Update the keyword's cluster to one of the valid category slugs, " +
          "then re-publish.",
        validCategories: (cats ?? []).map((c) => c.slug),
      },
      { status: 422 }
    );
  }

  const keyword: Keyword = {
    id: kwRow.id,
    keyword: kwRow.keyword,
    volume: kwRow.volume ?? undefined,
    difficulty: kwRow.difficulty ?? undefined,
    intent: kwRow.intent ?? undefined,
    cluster: canonicalCluster ?? undefined,
    funnelStage: kwRow.funnel_stage ?? undefined,
    priority: kwRow.priority ?? undefined,
    suggestedTitle: kwRow.suggested_title ?? undefined,
    competitorUrls: kwRow.competitor_urls ?? [],
    monetization: kwRow.monetization ?? undefined,
    status: kwRow.status,
    linkedPostSlug: kwRow.linked_post_slug ?? undefined,
  };

  const slug = slugifyStr(a.title);

  // If the routine generated a hero image, mirror it into our own Supabase
  // Storage bucket so we own the asset and the URL is stable. Falls back
  // to undefined (=> dynamic OG image) if the mirror step fails.
  let heroImageUrl: string | undefined;
  let heroImageAlt: string | undefined;
  if (body.image_url) {
    try {
      heroImageUrl = await mirrorImageToStorage(body.image_url, slug);
      heroImageAlt =
        body.image_alt ??
        `Abstract editorial illustration related to ${a.title}`;
    } catch (e) {
      console.error("[cron] image mirror failed:", (e as Error).message);
      // Don't fail the publish over an image issue; OG fallback covers it.
    }
  }

  const post = articleToPost({
    article: a,
    slug,
    authorId: "team",
    categorySlug: keyword.cluster ?? "ai-for-traders",
    tagSlugs: [],
    status: body.status ?? "published",
    scheduledFor: body.scheduled_for,
    monetization: keyword.monetization,
    intent: keyword.intent,
    funnelStage: keyword.funnelStage,
  });
  if (heroImageUrl) {
    post.featuredImage = heroImageUrl;
    post.featuredImageAlt = heroImageAlt;
  }

  try {
    await savePost(post);
  } catch (e) {
    return Response.json(
      { error: `savePost: ${(e as Error).message}` },
      { status: 500 }
    );
  }

  // Mark keyword as published, link to the new post
  try {
    await saveKeyword({
      ...keyword,
      status: "published",
      linkedPostSlug: slug,
    });
  } catch (e) {
    // Post was saved; just log keyword update failure
    console.error("[cron] saveKeyword failed:", e);
  }

  return Response.json({
    ok: true,
    slug,
    title: a.title,
    wordCount,
    keyword_id: body.keyword_id,
    featured_image: heroImageUrl ?? null,
  });
}

/**
 * Download a remote image URL and re-upload it to the public 'blog' bucket
 * in Supabase Storage. Returns the stable public Storage URL on success.
 * Caller wraps in try/catch — never throws to the API consumer.
 */
async function mirrorImageToStorage(
  sourceUrl: string,
  slug: string
): Promise<string> {
  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new Error("image_url must be http(s)");
  }
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`fetch image: HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  // We accept png/jpeg/webp from the upstream and normalize the storage
  // extension based on the response content-type.
  let ext = "jpg";
  if (contentType.includes("png")) ext = "png";
  else if (contentType.includes("webp")) ext = "webp";

  const buf = new Uint8Array(await res.arrayBuffer());
  const objectPath = `${slug}.${ext}`;

  const { error: upErr } = await db()
    .storage.from("blog")
    .upload(objectPath, buf, {
      contentType,
      upsert: true,
      cacheControl: "31536000", // 1y, the slug is unique per post
    });
  if (upErr) throw new Error(`storage upload: ${upErr.message}`);

  const { data: pub } = db().storage.from("blog").getPublicUrl(objectPath);
  if (!pub?.publicUrl) throw new Error("could not resolve public URL");
  return pub.publicUrl;
}

// ── helpers ──────────────────────────────────────────────────

function countArticleWords(a: GeneratedArticle): number {
  let n = 0;
  const addText = (s: unknown) => {
    if (typeof s !== "string") return;
    n += s.trim().split(/\s+/).filter(Boolean).length;
  };
  for (const b of a.blocks ?? []) {
    const block = b as Record<string, unknown>;
    addText(block.text);
    if (Array.isArray(block.items))
      for (const it of block.items) addText(it as string);
    if (Array.isArray(block.steps))
      for (const s of block.steps) {
        const step = s as Record<string, unknown>;
        addText(step.title);
        addText(step.body);
        addText(step.text);
        addText(step.name);
      }
    if (Array.isArray(block.pros)) for (const it of block.pros) addText(it as string);
    if (Array.isArray(block.cons)) for (const it of block.cons) addText(it as string);
    if (Array.isArray(block.headers))
      for (const it of block.headers) addText(it as string);
    if (Array.isArray(block.rows))
      for (const row of block.rows)
        if (Array.isArray(row)) for (const cell of row) addText(cell as string);
  }
  for (const f of a.faqs ?? []) {
    addText(f.q);
    addText(f.a);
  }
  return n;
}

/**
 * Coerce blocks produced by the routine into the canonical shape the
 * BlockRenderer expects. Heals the two drifts we've actually seen:
 *  - callout missing `variant`           -> defaults to "info"
 *  - steps using { items: string[] }     -> { steps: [{title:"", body:str}] }
 *  - steps using { items: [{title,body}] }-> { steps: same }
 *
 * Anything we don't recognize is passed through untouched so weirder
 * block types fall through to the renderer's default case (already a no-op).
 */
function normalizeBlocks(blocks: unknown[]): GeneratedArticle["blocks"] {
  return blocks.map((b) => {
    const block = b as Record<string, unknown>;
    switch (block.type) {
      case "callout": {
        const variant = block.variant;
        const validVariants = ["info", "warning", "success", "tip"];
        return {
          ...block,
          variant: validVariants.includes(variant as string) ? variant : "info",
        };
      }
      case "steps": {
        // Canonicalize on { steps: [{title, body}] }
        const raw =
          (block.steps as unknown) ??
          (block.items as unknown) ??
          [];
        if (!Array.isArray(raw)) return { ...block, steps: [] };
        const steps = raw.map((s) => {
          if (typeof s === "string") return { title: "", body: s };
          if (s && typeof s === "object") {
            const obj = s as { title?: string; body?: string; text?: string };
            return {
              title: obj.title ?? "",
              body: obj.body ?? obj.text ?? "",
            };
          }
          return { title: "", body: "" };
        });
        // Strip the spurious `items` so we don't keep both fields
        const { items: _ignored, ...rest } = block as { items?: unknown };
        void _ignored;
        return { ...rest, steps };
      }
      default:
        return block;
    }
  }) as GeneratedArticle["blocks"];
}

const BANNED_DASHES = ["—", "–"];
const BANNED_PHRASES = [
  "delve into",
  "dive into",
  "embark on",
  "in today's fast-paced",
  "navigate the complexities",
  "unlock the potential",
  "harness the power",
  "it's important to note",
  "needless to say",
  "tapestry",
  "myriad",
  "plethora",
  "moreover,",
  "furthermore,",
  "this comprehensive guide",
  "in conclusion,",
  "to sum up,",
  "the world of",
  "the realm of",
  "groundbreaking",
  "game-changing",
];

function scanForAiTells(a: GeneratedArticle): string | null {
  const haystack = JSON.stringify(a).toLowerCase();
  for (const d of BANNED_DASHES) if (haystack.includes(d)) return `dash: ${d}`;
  for (const p of BANNED_PHRASES) if (haystack.includes(p)) return `phrase: ${p}`;
  return null;
}

// Known aliases the routine occasionally produces; map them to the
// canonical slug used in the categories table. Extend if we see new
// drifts in routine output.
const CLUSTER_ALIASES: Record<string, string> = {
  automation: "trading-automation",
  productivity: "trader-productivity",
  research: "market-research",
  wealth: "wealth-systems",
  ai: "ai-for-traders",
  trading: "trading-automation",
};

/** Map a raw cluster value to a real category slug, or null if not found. */
async function resolveCategorySlug(raw: string): Promise<string | null> {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();

  // First try exact match against real categories
  const { data: exact } = await db()
    .from("categories")
    .select("slug")
    .eq("slug", lower)
    .maybeSingle();
  if (exact?.slug) return exact.slug;

  // Then try alias map
  const aliased = CLUSTER_ALIASES[lower];
  if (aliased) {
    const { data: aliasMatch } = await db()
      .from("categories")
      .select("slug")
      .eq("slug", aliased)
      .maybeSingle();
    if (aliasMatch?.slug) return aliasMatch.slug;
  }
  return null;
}
