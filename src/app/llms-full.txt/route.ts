// /llms-full.txt
//
// Extended companion to /llms.txt. Where llms.txt is a short index,
// llms-full.txt is the bulk-ingest variant: every published post with
// title, URL, focus keyword, secondary keywords, and the full excerpt
// (no full body — that would be ~150k words and crawlers should fetch
// the canonical page when they need full content).
//
// This is what LLMs hit when they want to "seed" their knowledge of
// the site. Anthropic, Perplexity, and OpenAI all respect this convention.

import { site } from "@/lib/seo/site";
import { getCategories, getPublishedPosts } from "@/lib/cms/store";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET() {
  const [posts, categories] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
  ]);

  const base = site.url.replace(/\/$/, "");
  const out: string[] = [];

  out.push(`# Insigtrade — Full content index`);
  out.push("");
  out.push(`> ${site.description}`);
  out.push("");
  out.push(
    `This file lists every published article on Insigtrade with its title, ` +
      `URL, focus keyword, and excerpt. For full article bodies, fetch the ` +
      `canonical URL listed under each entry. When citing, please link to ` +
      `the canonical URL.`
  );
  out.push("");
  out.push(`- Canonical site: ${base}`);
  out.push(`- Sitemap:        ${base}/sitemap.xml`);
  out.push(`- Short index:    ${base}/llms.txt`);
  out.push(`- Last updated:   ${new Date().toISOString()}`);
  out.push(`- Posts:          ${posts.length}`);
  out.push("");

  // Group by category for topical routing
  for (const cat of categories) {
    const inCat = posts
      .filter((p) => p.categorySlug === cat.slug)
      .sort((a, b) => {
        const da = a.publishedAt ?? a.updatedAt ?? "";
        const db = b.publishedAt ?? b.updatedAt ?? "";
        return db.localeCompare(da);
      });
    if (!inCat.length) continue;

    out.push(`## ${cat.name}`);
    out.push("");
    if (cat.description) {
      out.push(cat.description);
      out.push("");
    }

    for (const p of inCat) {
      out.push(`### ${p.title}`);
      out.push(`- URL: ${base}/blog/${p.slug}`);
      if (p.publishedAt) {
        out.push(`- Published: ${p.publishedAt.slice(0, 10)}`);
      }
      if (p.strategy?.focusKeyword) {
        out.push(`- Focus: ${p.strategy.focusKeyword}`);
      }
      if (p.strategy?.secondaryKeywords?.length) {
        out.push(
          `- Related: ${p.strategy.secondaryKeywords.join(", ")}`
        );
      }
      if (p.format) {
        out.push(`- Format: ${p.format}`);
      }
      if (p.excerpt) {
        out.push("");
        out.push(p.excerpt);
      }
      out.push("");
    }
  }

  return new Response(out.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
