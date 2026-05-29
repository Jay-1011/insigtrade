#!/usr/bin/env node
// One-off helper: uploads every file in ./public/blog/ to the Supabase
// Storage bucket "blog" (public) and rewrites posts.featured_image to
// point at the public Storage URL. Idempotent — safe to re-run.
//
// Usage:  node scripts/upload-images-to-supabase-storage.mjs
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.

import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMG_DIR = path.join(ROOT, "public", "blog");
const BUCKET = "blog";

async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}

await loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Ensure bucket exists
{
  const { data: buckets } = await sb.storage.listBuckets();
  if (!buckets?.some((b) => b.name === BUCKET)) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });
    if (error) {
      console.error("createBucket:", error.message);
      process.exit(1);
    }
    console.log(`✓ created bucket "${BUCKET}"`);
  } else {
    console.log(`✓ bucket "${BUCKET}" already exists`);
  }
}

// Upload every image file
let files = [];
try {
  files = (await fs.readdir(IMG_DIR)).filter((f) =>
    /\.(jpe?g|png|webp)$/i.test(f)
  );
} catch (e) {
  if (e.code === "ENOENT") {
    console.log("No ./public/blog/ directory — nothing to upload.");
    process.exit(0);
  }
  throw e;
}

const contentType = (name) =>
  name.endsWith(".png") ? "image/png" :
  name.endsWith(".webp") ? "image/webp" :
  "image/jpeg";

for (const name of files) {
  const buf = await fs.readFile(path.join(IMG_DIR, name));
  const { error } = await sb.storage.from(BUCKET).upload(name, buf, {
    contentType: contentType(name),
    upsert: true,
  });
  if (error) {
    console.error(`✗ ${name}: ${error.message}`);
  } else {
    console.log(`✓ uploaded ${name}`);
  }
}

// Rewrite posts.featured_image: /blog/foo.jpg → storage public URL
const storageBase = `${url}/storage/v1/object/public/${BUCKET}/`;
const { data: posts, error: selErr } = await sb
  .from("posts")
  .select("id, slug, featured_image")
  .like("featured_image", "/blog/%");
if (selErr) {
  console.error("select posts:", selErr.message);
} else if (posts && posts.length) {
  for (const p of posts) {
    const newUrl = p.featured_image.replace("/blog/", storageBase);
    const { error } = await sb
      .from("posts")
      .update({ featured_image: newUrl })
      .eq("id", p.id);
    if (error) console.error(`update ${p.slug}:`, error.message);
    else console.log(`✓ repointed ${p.slug}`);
  }
} else {
  console.log("✓ no posts needed URL rewriting");
}

console.log("\nDone.");
