// Public read-only helper for the Claude daily-blog routine.
// Returns up to 5 recent published posts in a category, formatted as
// internal-links the routine can drop straight into an internal-links block.
//
//   GET /api/internal-links?cluster=ai-for-traders&limit=4
//
// Response:
//   { links: [ { label: "Post title", href: "/blog/slug" }, ... ] }

import type { NextRequest } from "next/server";
import { getPublishedPosts } from "@/lib/cms/store";

export const runtime = "nodejs";
export const revalidate = 300; // 5 min

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cluster = searchParams.get("cluster") ?? "";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 4), 1), 10);
  const excludeSlug = searchParams.get("exclude") ?? "";

  const posts = await getPublishedPosts();
  const filtered = posts
    .filter((p) => !cluster || p.categorySlug === cluster)
    .filter((p) => p.slug !== excludeSlug)
    .slice(0, limit)
    .map((p) => ({ label: p.title, href: `/blog/${p.slug}` }));

  return Response.json(
    { links: filtered },
    {
      headers: {
        // Routine should not get a stale cached list for too long
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}
