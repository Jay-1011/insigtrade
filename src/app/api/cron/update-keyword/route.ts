// PATCH /api/cron/update-keyword
// Body: { id?: string, keyword?: string, ...partial fields }
//
// Update one keyword by id OR by exact keyword text (case-insensitive).
// Used by the monthly audit routine to mark losers as 'update', or to
// promote winners' siblings to priority='high'.

import { NextRequest } from "next/server";
import { authorizeCronRequest } from "@/lib/cron/auth";
import { db } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UpdateBody {
  id?: string;
  keyword?: string;
  status?: "idea" | "writing" | "published" | "update";
  priority?: "low" | "medium" | "high";
  cluster?: string;
  suggested_title?: string;
  linked_post_slug?: string;
}

export async function PATCH(req: NextRequest) {
  const auth = authorizeCronRequest(req);
  if (!auth.ok) return auth.response!;

  let body: UpdateBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.id && !body.keyword) {
    return Response.json(
      { error: "Provide id or keyword to identify the row" },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.cluster !== undefined) updates.cluster = body.cluster;
  if (body.suggested_title !== undefined)
    updates.suggested_title = body.suggested_title;
  if (body.linked_post_slug !== undefined)
    updates.linked_post_slug = body.linked_post_slug;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No update fields provided" }, { status: 400 });
  }

  let q = db().from("keywords").update(updates);
  if (body.id) q = q.eq("id", body.id);
  else q = q.ilike("keyword", body.keyword!.trim());

  const { data, error } = await q.select("id, keyword, status, priority");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, updated: data ?? [] });
}
