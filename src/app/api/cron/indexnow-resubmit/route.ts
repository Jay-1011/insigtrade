// POST /api/cron/indexnow-resubmit
//
// Manually resubmit URLs to IndexNow. Use cases:
//   - Backfill all currently published posts after enabling IndexNow
//   - Force re-discovery after a title/content rewrite outside the routine
//   - Resubmit the sitemap.xml itself
//
// Two modes:
//   { "urls": ["https://...", "..."] }   - submit specific URLs
//   { "mode": "all-posts" }              - submit every published post + sitemap
//
// Auth: same Bearer CRON_SECRET as other /api/cron/* endpoints.

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { getPublishedPosts } from "@/lib/cms/store";
import { submitToIndexNow } from "@/lib/seo/indexnow";
import { site, absoluteUrl } from "@/lib/seo/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ResubmitBody {
  urls?: string[];
  mode?: "all-posts";
}

export async function POST(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  let body: ResubmitBody = {};
  try {
    body = (await req.json()) as ResubmitBody;
  } catch {
    // Empty body is OK — default to all-posts in that case.
  }

  let urls: string[] = [];

  if (body.mode === "all-posts") {
    const posts = await getPublishedPosts();
    urls = posts.map((p) => absoluteUrl(`/blog/${p.slug}`));
    // Always include the sitemap so engines re-fetch their URL list
    urls.push(`${site.url.replace(/\/$/, "")}/sitemap.xml`);
  } else if (Array.isArray(body.urls) && body.urls.length > 0) {
    urls = body.urls;
  } else {
    return Response.json(
      { error: 'Provide { "urls": [...] } or { "mode": "all-posts" }' },
      { status: 400 }
    );
  }

  const result = await submitToIndexNow(urls);
  return Response.json({
    ok: result.ok,
    submitted: result.submitted,
    received: urls.length,
    error: result.error,
  });
}
