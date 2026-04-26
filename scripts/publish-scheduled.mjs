#!/usr/bin/env node
// node scripts/publish-scheduled.mjs
// Run via cron (or any scheduler). Promotes scheduled posts whose scheduledFor <= now
// to status='published' and stamps publishedAt.

import { promises as fs } from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "content", "posts");
const now = new Date().toISOString();

async function main() {
  const files = await fs.readdir(dir).catch(() => []);
  let promoted = 0;
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const p = path.join(dir, f);
    const post = JSON.parse(await fs.readFile(p, "utf8"));
    if (post.status !== "scheduled" || !post.scheduledFor) continue;
    if (post.scheduledFor > now) continue;
    post.status = "published";
    post.publishedAt = post.scheduledFor;
    post.updatedAt = now;
    await fs.writeFile(p, JSON.stringify(post, null, 2), "utf8");
    promoted++;
    console.log(`✓ published: ${post.slug}`);
  }
  console.log(`Done. ${promoted} post(s) published.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
