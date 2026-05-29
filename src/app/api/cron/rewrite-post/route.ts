// POST /api/cron/rewrite-post
//
// Replaces the body of an existing post (by id) with a freshly-written
// article that follows the daily-routine validation rules: 2,000-2,500
// words, no banned phrases, no em/en dashes, consistent template.
//
// Preserves: id, slug, created_at, status, category_slug, format
//            (so SEO redirects and indexing aren't disrupted)
// Replaces:  title, subtitle, excerpt, blocks, faqs, seo, strategy,
//            read_time, featured_image (if image_url provided),
//            featured_image_alt, updated_at
//
// Body: {
//   post_id: string,
//   article: GeneratedArticle,
//   image_url?: string,
//   image_alt?: string,
//   preserve_title?: boolean   // if true, keep existing title
// }

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { db } from "@/lib/supabase/server";
import type { GeneratedArticle } from "@/lib/ai/claude";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RewriteBody {
  post_id: string;
  article: GeneratedArticle;
  image_url?: string;
  image_alt?: string;
  preserve_title?: boolean;
}

export async function POST(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  let body: RewriteBody;
  try {
    body = (await req.json()) as RewriteBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body?.post_id || !body?.article) {
    return Response.json(
      { error: "Missing post_id or article" },
      { status: 400 }
    );
  }
  const a = body.article;
  if (!a.title || !Array.isArray(a.blocks)) {
    return Response.json(
      { error: "article must include title and blocks[]" },
      { status: 400 }
    );
  }

  // Quality gates (same as publish-article)
  const wordCount = countArticleWords(a);
  if (wordCount < 1800) {
    return Response.json(
      {
        error: "Article rejected: under 1,800 words",
        wordCount,
        hint: "Regenerate longer before retrying.",
      },
      { status: 422 }
    );
  }
  const tellFlag = scanForAiTells(a);
  if (tellFlag) {
    return Response.json(
      {
        error: "Article rejected: contains banned content",
        offender: tellFlag,
        hint: "Regenerate without the offending phrase or dash.",
      },
      { status: 422 }
    );
  }

  // Load existing post to preserve immutable fields
  const { data: existing, error: selErr } = await db()
    .from("posts")
    .select("id, slug, title, status, category_slug, created_at, format")
    .eq("id", body.post_id)
    .maybeSingle();
  if (selErr || !existing) {
    return Response.json(
      { error: "Post not found", post_id: body.post_id },
      { status: 404 }
    );
  }

  // Optional image mirror
  let heroImageUrl: string | undefined;
  let heroImageAlt: string | undefined;
  if (body.image_url) {
    try {
      heroImageUrl = await mirrorImageToStorage(body.image_url, existing.slug);
      heroImageAlt =
        body.image_alt ??
        `Abstract editorial illustration related to ${a.title}`;
    } catch (e) {
      console.error("[cron] image mirror failed:", (e as Error).message);
    }
  }

  // Build the update payload. Use the existing slug/id/created_at/status
  // so SEO and indexing don't break. Use the new content.
  const updates: Record<string, unknown> = {
    title: body.preserve_title ? existing.title : a.title,
    subtitle: a.subtitle ?? null,
    excerpt: a.excerpt ?? "",
    format: a.format ?? existing.format,
    read_time: a.readTime ?? null,
    blocks: a.blocks ?? [],
    faqs: a.faqs ?? [],
    seo: a.seo ?? null,
    strategy: a.strategy ?? null,
    updated_at: new Date().toISOString(),
  };
  if (heroImageUrl) {
    updates.featured_image = heroImageUrl;
    updates.featured_image_alt = heroImageAlt;
  }

  const { error: upErr } = await db()
    .from("posts")
    .update(updates)
    .eq("id", body.post_id);
  if (upErr) {
    return Response.json(
      { error: `update post: ${upErr.message}` },
      { status: 500 }
    );
  }

  return Response.json({
    ok: true,
    post_id: body.post_id,
    slug: existing.slug,
    title: body.preserve_title ? existing.title : a.title,
    wordCount,
    featured_image: heroImageUrl ?? null,
  });
}

// ── helpers (same logic as publish-article; duplicated to keep route deps minimal)

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
  "delve into","dive into","embark on","in today's fast-paced",
  "navigate the complexities","unlock the potential","harness the power",
  "it's important to note","needless to say","tapestry","myriad","plethora",
  "moreover,","furthermore,","this comprehensive guide","in conclusion,",
  "to sum up,","the world of","the realm of","groundbreaking","game-changing",
];

function scanForAiTells(a: GeneratedArticle): string | null {
  const haystack = JSON.stringify(a).toLowerCase();
  for (const d of BANNED_DASHES) if (haystack.includes(d)) return `dash: ${d}`;
  for (const p of BANNED_PHRASES) if (haystack.includes(p)) return `phrase: ${p}`;
  return null;
}

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
      cacheControl: "31536000",
    });
  if (upErr) throw new Error(`storage upload: ${upErr.message}`);

  const { data: pub } = db().storage.from("blog").getPublicUrl(objectPath);
  if (!pub?.publicUrl) throw new Error("could not resolve public URL");
  return pub.publicUrl;
}
