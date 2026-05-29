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
  });
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
