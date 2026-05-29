// GET /api/cron/queue-status
//
// Lightweight dashboard for routines: per-cluster and per-status counts
// of keywords + counts of published posts. Used by the weekly research
// routine to decide which clusters need topping up, and by the monthly
// audit to gate the audit on having enough data.

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  // Pull a slim view of all keywords (one query)
  const { data: kws, error: kwErr } = await db()
    .from("keywords")
    .select("status, cluster");
  if (kwErr) return Response.json({ error: kwErr.message }, { status: 500 });

  const byStatus: Record<string, number> = {};
  const byClusterIdea: Record<string, number> = {};
  for (const k of kws ?? []) {
    const s = (k.status as string) ?? "unknown";
    byStatus[s] = (byStatus[s] ?? 0) + 1;
    if (s === "idea") {
      const c = (k.cluster as string) ?? "unknown";
      byClusterIdea[c] = (byClusterIdea[c] ?? 0) + 1;
    }
  }

  const { count: publishedPostsCount } = await db()
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");

  // posts older than 14 days
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { count: matureCount } = await db()
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .lt("published_at", cutoff);

  return Response.json({
    keywords: {
      total: kws?.length ?? 0,
      byStatus,
      ideaByCluster: byClusterIdea,
    },
    posts: {
      published: publishedPostsCount ?? 0,
      publishedOlderThan14d: matureCount ?? 0,
    },
  });
}
