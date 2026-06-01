// Dynamic sitemap.xml — generated at request time from Supabase.
//
// Includes:
//   - Static pages (home, blog, reviews, products, about, contact)
//   - Every published post (with lastModified + featured image inline)
//   - Every category (with lastModified = newest post in cluster)
//   - Every tag (with lastModified = newest post tagged)
//   - Every tool review page
//
// Image sitemap entries are added inline on each post (Google Image Search
// uses these to discover and rank the AI-generated hero images).

import type { MetadataRoute } from "next";
import { site, absoluteUrl } from "@/lib/seo/site";
import {
  getCategories,
  getPublishedPosts,
  getTags,
  getTools,
} from "@/lib/cms/store";

// Tell Next.js to re-render the sitemap at most every 5 minutes. New posts
// from the daily routine become discoverable to Google within that window.
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, tools] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTags(),
    getTools(),
  ]);

  const base = site.url.replace(/\/$/, "");

  // Newest activity date across all posts — used as lastModified for index
  // pages so search engines re-crawl /, /blog, etc. whenever a new post lands.
  const newest = mostRecent(posts.map((p) => p.updatedAt ?? p.publishedAt));

  // ─── Static pages ────────────────────────────────────────
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: newest,
      changeFrequency: "daily",
      priority: 1.0,
      images: [absoluteUrl("/opengraph-image")],
    },
    {
      url: `${base}/blog`,
      lastModified: newest,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/reviews`,
      lastModified: newestForFormat(posts, "tool-review") ?? newest,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/products`,
      lastModified: newest,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${base}/about`,
      lastModified: newest,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/contact`,
      lastModified: newest,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // ─── Posts (with inline image sitemap entries) ───────────
  const postEntries: MetadataRoute.Sitemap = posts.map((p) => {
    const heroImage =
      p.featuredImage ??
      // Fallback to the per-post dynamic OG image so every post ships an image
      // entry. Google rewards image-rich sitemaps for content discovery.
      absoluteUrl(`/blog/${p.slug}/opengraph-image`);
    return {
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.updatedAt ?? p.publishedAt ?? Date.now()),
      changeFrequency: p.format === "tool-review" ? "weekly" : "monthly",
      // Featured listicles + tool reviews convert better — surface them higher.
      priority:
        p.format === "tool-review" || p.format === "comparison"
          ? 0.85
          : 0.8,
      images: [absoluteUrl(heroImage)],
    };
  });

  // ─── Categories (cluster pages) ──────────────────────────
  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => {
    const inCat = posts.filter((p) => p.categorySlug === c.slug);
    return {
      url: `${base}/category/${c.slug}`,
      lastModified: mostRecent(inCat.map((p) => p.updatedAt)) ?? newest,
      changeFrequency: "weekly",
      priority: 0.7,
    };
  });

  // ─── Tags ────────────────────────────────────────────────
  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => {
    const tagged = posts.filter((p) => p.tagSlugs?.includes(t.slug));
    return {
      url: `${base}/tag/${t.slug}`,
      lastModified: mostRecent(tagged.map((p) => p.updatedAt)) ?? newest,
      changeFrequency: "weekly",
      priority: 0.5,
    };
  });

  // ─── Tool review pages ───────────────────────────────────
  const toolEntries: MetadataRoute.Sitemap = tools.map((t) => {
    // Use the latest review post for this tool as a freshness signal
    const reviewedAt = mostRecent(
      posts
        .filter((p) => p.reviewToolId === t.id)
        .map((p) => p.updatedAt ?? p.publishedAt)
    );
    return {
      url: `${base}/reviews/${t.slug}`,
      lastModified: reviewedAt ?? newest,
      changeFrequency: "weekly",
      priority: 0.75,
      images: t.logo ? [absoluteUrl(t.logo)] : undefined,
    };
  });

  return [
    ...staticEntries,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
    ...toolEntries,
  ];
}

// ─── helpers ────────────────────────────────────────────────

/** Return the most recent ISO date in the list as a Date, or undefined. */
function mostRecent(
  isoStrings: (string | undefined | null)[]
): Date | undefined {
  const valid = isoStrings
    .filter((s): s is string => Boolean(s))
    .map((s) => new Date(s))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (!valid.length) return undefined;
  return new Date(Math.max(...valid.map((d) => d.getTime())));
}

/** Most-recent updatedAt across posts of a given format. */
function newestForFormat(
  posts: Array<{ format: string; updatedAt?: string; publishedAt?: string }>,
  format: string
): Date | undefined {
  return mostRecent(
    posts.filter((p) => p.format === format).map((p) => p.updatedAt ?? p.publishedAt)
  );
}
