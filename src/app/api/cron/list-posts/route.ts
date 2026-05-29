// GET /api/cron/list-posts?status=published&before=<ISO>&limit=N
//
// Lists posts so the rewrite routine can discover what to refresh. Returns
// only the lightweight fields needed to decide whether a rewrite is needed
// (title, slug, format, category_slug, excerpt, current word_count proxy).
// The routine then calls /api/cron/rewrite-post per row.

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "published";
  const before = url.searchParams.get("before");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  let q = db()
    .from("posts")
    .select(
      "id, slug, title, subtitle, excerpt, format, category_slug, featured_image, published_at, updated_at, blocks, faqs, seo, strategy"
    )
    .eq("status", status)
    .order("published_at", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (before) {
    q = q.lt("published_at", before);
  }

  const { data, error } = await q;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Compute approximate word count + violation flags so the routine can prioritize.
  const BANNED_DASHES = ["—", "–"];
  const BANNED_PHRASES = [
    "delve into","dive into","embark on","in today's fast-paced",
    "navigate the complexities","unlock the potential","harness the power",
    "it's important to note","needless to say","tapestry","myriad","plethora",
    "moreover,","furthermore,","this comprehensive guide","in conclusion,",
    "to sum up,","the world of","the realm of","groundbreaking","game-changing",
  ];

  const summarized = (data ?? []).map((p) => {
    const raw = JSON.stringify({ blocks: p.blocks, faqs: p.faqs });
    const lower = raw.toLowerCase();
    const wordCount = raw
      .replace(/[{}\[\]":,]/g, " ")
      .split(/\s+/)
      .filter((w) => /[a-z]/i.test(w))
      .length;
    const offenders: string[] = [];
    for (const d of BANNED_DASHES) if (raw.includes(d)) offenders.push(`dash: ${d}`);
    for (const pp of BANNED_PHRASES) if (lower.includes(pp)) offenders.push(`phrase: ${pp}`);
    const needsRewrite = wordCount < 1800 || offenders.length > 0;
    return {
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      format: p.format,
      category_slug: p.category_slug,
      featured_image: p.featured_image,
      published_at: p.published_at,
      approx_word_count: wordCount,
      needs_rewrite: needsRewrite,
      offenders,
    };
  });

  return Response.json({ posts: summarized });
}
