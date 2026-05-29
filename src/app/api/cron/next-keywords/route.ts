// GET /api/cron/next-keywords?limit=2
// Returns the next N keywords to write, ordered by priority desc then KD asc.
// Used by the daily blog routine to pull the work queue.

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 2), 1), 10);
  const cluster = url.searchParams.get("cluster"); // optional filter

  let q = db()
    .from("keywords")
    .select("*")
    .eq("status", "idea")
    .order("priority", { ascending: false, nullsFirst: false })
    .order("difficulty", { ascending: true, nullsFirst: false })
    .limit(limit);
  if (cluster) q = q.eq("cluster", cluster);

  const { data, error } = await q;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ keywords: data ?? [] });
}
