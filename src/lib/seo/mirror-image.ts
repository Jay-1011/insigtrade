// Server-side helper that downloads a remote image (typically a Higgsfield
// CDN URL) and re-uploads it to our public Supabase 'blog' bucket as an
// optimized JPEG. Used by both /api/cron/publish-article and
// /api/cron/rewrite-post.
//
// Higgsfield z_image returns 3-5 MB PNGs at 2048x1152. That's wasteful
// for a blog hero — sharp resizes to max 1600px wide and recompresses
// to JPEG q82 mozjpeg, yielding ~150-300 KB files.

import "server-only";
import { db } from "@/lib/supabase/server";

export interface MirrorImageResult {
  publicUrl: string;
  inputBytes: number;
  outputBytes: number;
}

/**
 * Download → resize/compress → upload. Throws on any failure; caller wraps
 * in try/catch so a bad image never blocks publishing the article.
 */
export async function mirrorImageToStorage(
  sourceUrl: string,
  slug: string
): Promise<MirrorImageResult> {
  if (!/^https?:\/\//i.test(sourceUrl)) {
    throw new Error("image_url must be http(s)");
  }
  const res = await fetch(sourceUrl);
  if (!res.ok) throw new Error(`fetch image: HTTP ${res.status}`);

  // Dynamic import keeps sharp out of the edge bundle.
  const sharpMod = await import("sharp");
  const sharp = sharpMod.default;

  const inputBuf = Buffer.from(await res.arrayBuffer());
  const outputBuf = await sharp(inputBuf, { failOn: "none" })
    .rotate() // honor EXIF orientation
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();

  const objectPath = `${slug}.jpg`;
  const { error: upErr } = await db()
    .storage.from("blog")
    .upload(objectPath, outputBuf, {
      contentType: "image/jpeg",
      upsert: true,
      cacheControl: "31536000", // 1y; the slug is unique per post
    });
  if (upErr) throw new Error(`storage upload: ${upErr.message}`);

  const { data: pub } = db().storage.from("blog").getPublicUrl(objectPath);
  if (!pub?.publicUrl) throw new Error("could not resolve public URL");

  console.log(
    `[mirror-image] ${slug}: ${Math.round(inputBuf.byteLength / 1024)}KB -> ` +
      `${Math.round(outputBuf.byteLength / 1024)}KB (saved ` +
      `${Math.round(
        ((inputBuf.byteLength - outputBuf.byteLength) / inputBuf.byteLength) *
          100
      )}%)`
  );

  return {
    publicUrl: pub.publicUrl,
    inputBytes: inputBuf.byteLength,
    outputBytes: outputBuf.byteLength,
  };
}
