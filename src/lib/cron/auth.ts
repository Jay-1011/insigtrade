// Shared Bearer-token auth for /api/cron/* routes used by the scheduled
// Claude routines (daily blog generation, weekly keyword research,
// monthly content audit). The routines run in Anthropic's remote
// sandbox, which blocks direct *.supabase.co egress, so they go
// through these endpoints instead. The site (Vercel) then talks to
// Supabase server-side using the service-role client.

import "server-only";

export interface CronAuthResult {
  ok: boolean;
  /** 401 / 500 Response to return when ok=false. */
  response?: Response;
}

export function authorizeCronRequest(req: Request): CronAuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return {
      ok: false,
      response: Response.json(
        { error: "CRON_SECRET not configured on the server" },
        { status: 500 }
      ),
    };
  }
  const header = req.headers.get("authorization") ?? "";
  const provided = header.replace(/^Bearer\s+/i, "").trim();
  if (!provided || provided !== secret) {
    return {
      ok: false,
      response: Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }
  return { ok: true };
}
