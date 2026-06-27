#!/usr/bin/env node
// One-off backfill: find every published post whose featured_image is a
// PNG in Supabase Storage, download it, recompress via sharp (max 1600px
// wide, JPEG q82 mozjpeg), upload as <slug>.jpg, update the DB to point
// at the new JPEG, and delete the old PNG.
//
// Run from the repo root:
//   node scripts/optimize-existing-images.mjs
// Optional flag:
//   --dry-run    Show what would change without writing anything

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ---- load .env.local ----------------------------------------
async function loadEnv() {
  try {
    const raw = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.+)\s*$/);
      if (m && !process.env[m[1]])
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
await loadEnv();

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const sb = createClient(SB_URL, SB_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---- find the work -----------------------------------------
const { data: posts, error: qErr } = await sb
  .from("posts")
  .select("id, slug, featured_image")
  .eq("status", "published")
  .ilike("featured_image", "%.png");

if (qErr) {
  console.error("query failed:", qErr.message);
  process.exit(1);
}
console.log(
  `${posts.length} posts have a PNG featured_image. ${DRY_RUN ? "(dry-run)" : ""}\n`
);

let totalIn = 0;
let totalOut = 0;
let okCount = 0;
let failCount = 0;

for (const p of posts) {
  process.stdout.write(`${p.slug.padEnd(58)} `);
  try {
    // 1. Download the PNG
    const res = await fetch(p.featured_image);
    if (!res.ok) throw new Error(`fetch ${res.status}`);
    const inputBuf = Buffer.from(await res.arrayBuffer());

    // 2. Recompress via sharp
    const outputBuf = await sharp(inputBuf, { failOn: "none" })
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toBuffer();

    const inKB = Math.round(inputBuf.byteLength / 1024);
    const outKB = Math.round(outputBuf.byteLength / 1024);
    const savedPct = Math.round(((inputBuf.byteLength - outputBuf.byteLength) / inputBuf.byteLength) * 100);
    totalIn += inputBuf.byteLength;
    totalOut += outputBuf.byteLength;

    if (DRY_RUN) {
      console.log(`would: ${inKB}KB -> ${outKB}KB (-${savedPct}%)`);
      okCount++;
      continue;
    }

    // 3. Upload <slug>.jpg
    const objectPath = `${p.slug}.jpg`;
    const { error: upErr } = await sb.storage
      .from("blog")
      .upload(objectPath, outputBuf, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
    if (upErr) throw new Error(`storage upload: ${upErr.message}`);

    // 4. Update the DB row
    const { data: pub } = sb.storage.from("blog").getPublicUrl(objectPath);
    const { error: dbErr } = await sb
      .from("posts")
      .update({ featured_image: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (dbErr) throw new Error(`db update: ${dbErr.message}`);

    // 5. Delete the old PNG to free Storage
    const oldKey = p.featured_image.split("/public/blog/")[1];
    if (oldKey && oldKey !== objectPath) {
      const { error: rmErr } = await sb.storage.from("blog").remove([oldKey]);
      if (rmErr) console.warn(`  warn: could not delete old ${oldKey}: ${rmErr.message}`);
    }

    console.log(`OK   ${inKB}KB -> ${outKB}KB (-${savedPct}%)`);
    okCount++;
  } catch (e) {
    console.log(`FAIL ${e.message}`);
    failCount++;
  }
}

// ---- summary ------------------------------------------------
console.log("\n" + "=".repeat(60));
console.log(`Posts processed: ${posts.length}`);
console.log(`  OK:    ${okCount}`);
console.log(`  Fail:  ${failCount}`);
console.log(`Total input:  ${(totalIn / 1024 / 1024).toFixed(1)} MB`);
console.log(`Total output: ${(totalOut / 1024 / 1024).toFixed(1)} MB`);
if (totalIn > 0) {
  const savedPct = Math.round(((totalIn - totalOut) / totalIn) * 100);
  console.log(`Saved:        ${((totalIn - totalOut) / 1024 / 1024).toFixed(1)} MB (-${savedPct}%)`);
}
console.log("=".repeat(60));
