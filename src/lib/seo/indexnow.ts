// IndexNow client.
//
// Submits new / updated URLs to Bing + Yandex (any IndexNow-aware engine
// gets the ping through api.indexnow.org). Google does NOT use IndexNow,
// but they still discover via the sitemap.xml we serve.
//
// Usage:
//   await submitToIndexNow([
//     "https://insigtrade.com/blog/foo",
//     "https://insigtrade.com/blog/bar",
//   ]);
//
// Errors are swallowed (logged) so they never block a publish. The
// site keeps a public verification file at /<INDEXNOW_KEY>.txt that
// search engines fetch to confirm we own the key.
//
// Docs: https://www.indexnow.org/documentation

import "server-only";
import { site } from "@/lib/seo/site";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow";
// IndexNow allows up to 10,000 URLs per request, but we cap at 500 per
// batch to stay polite and avoid weirdly-large payloads.
const MAX_BATCH = 500;

export interface IndexNowResult {
  ok: boolean;
  submitted: number;
  status?: number;
  error?: string;
}

/**
 * Submit one or many URLs to IndexNow. Returns a summary. Never throws.
 *
 * Side-effect only — fire-and-forget. Errors are logged to console
 * but do not propagate.
 */
export async function submitToIndexNow(
  urls: string[]
): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    console.warn("[indexnow] INDEXNOW_KEY not set — skipping submission");
    return { ok: false, submitted: 0, error: "INDEXNOW_KEY not set" };
  }
  const cleanUrls = uniqueOnly(urls.filter(Boolean));
  if (cleanUrls.length === 0) {
    return { ok: true, submitted: 0 };
  }

  // The host derived from the site URL. IndexNow matches the URL prefix.
  const host = new URL(site.url).host;
  const keyLocation = `${site.url.replace(/\/$/, "")}/${key}.txt`;

  let total = 0;
  for (const batch of chunk(cleanUrls, MAX_BATCH)) {
    const body = {
      host,
      key,
      keyLocation,
      urlList: batch,
    };
    try {
      const res = await fetch(INDEXNOW_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      });
      // IndexNow returns:
      //   200 OK              — URLs received
      //   202 Accepted        — received, will be validated
      //   400 Bad Request     — invalid format
      //   403 Forbidden       — keyLocation doesn't match
      //   422 Unprocessable   — URLs don't match host
      //   429 Too Many Requests
      if (res.status >= 200 && res.status < 300) {
        total += batch.length;
        console.log(
          `[indexnow] ${res.status} — submitted ${batch.length} URL(s)`
        );
      } else {
        const text = await res.text().catch(() => "");
        console.warn(
          `[indexnow] ${res.status} on batch of ${batch.length}: ${text}`
        );
      }
    } catch (e) {
      console.error(
        `[indexnow] fetch failed on batch of ${batch.length}:`,
        (e as Error).message
      );
    }
  }

  return { ok: total > 0, submitted: total };
}

// ── helpers ────────────────────────────────────────────────

function uniqueOnly(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
