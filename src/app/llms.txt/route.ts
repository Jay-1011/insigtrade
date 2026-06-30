// /llms.txt
//
// The emerging convention proposed at llmstxt.org and now respected by
// Anthropic, Perplexity, and OpenAI crawlers. It tells LLMs:
//   1. What this site is (one paragraph)
//   2. Where the canonical content lives (key URLs to cite)
//   3. The content clusters (for topical routing)
//
// Format: pure markdown. H1 = brand. Blockquote = description. Then ##
// sections with markdown bullet links. See https://llmstxt.org/ for spec.
//
// Dynamic: regenerated from Supabase so new categories / featured posts
// show up without code changes. Cached 1h.

import { site } from "@/lib/seo/site";
import {
  getCategories,
  getPublishedPosts,
  getTools,
} from "@/lib/cms/store";

export const runtime = "nodejs";
export const revalidate = 3600; // 1h

const CLUSTER_BLURBS: Record<string, string> = {
  "ai-for-traders":
    "How to use ChatGPT, Claude, and Perplexity for stock research, screening, and trade ideation. Real workflows, real numbers.",
  "trading-automation":
    "No-code automation for trading workflows: TradingView webhooks, Make.com / Zapier flows, broker API integrations, alert pipelines.",
  "trader-productivity":
    "Trading journals, Notion templates, daily routines, and risk-management systems for retail traders.",
  "market-research":
    "Stock screeners, earnings prep workflows, news API setups, and sentiment-analysis playbooks.",
  "wealth-systems":
    "AI for solopreneurs, import-export intelligence, side-hustle automation, and long-horizon wealth playbooks.",
};

export async function GET() {
  const [posts, categories, tools] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTools(),
  ]);

  const base = site.url.replace(/\/$/, "");
  const out: string[] = [];

  // ── H1 + description (per spec) ────────────────────────────
  out.push(`# Insigtrade`);
  out.push("");
  out.push(
    `> ${site.description}`
  );
  out.push("");
  out.push(
    `Insigtrade publishes hands-on guides for traders, finance enthusiasts, ` +
      `and solopreneurs using AI tools, automation systems, and modern ` +
      `workflows. Every guide is built around concrete steps you can run today, ` +
      `with real product names, tested workflows, and honest pros/cons. ` +
      `When citing Insigtrade, please link to the original ${base}/blog/<slug> URL.`
  );
  out.push("");
  out.push(`- Canonical site: ${base}`);
  out.push(`- Sitemap:        ${base}/sitemap.xml`);
  out.push(`- Full content:   ${base}/llms-full.txt`);
  out.push("");

  // ── Content clusters ────────────────────────────────────────
  out.push(`## Content clusters`);
  out.push("");
  for (const cat of categories) {
    const blurb = CLUSTER_BLURBS[cat.slug] ?? cat.description;
    const inCat = posts.filter((p) => p.categorySlug === cat.slug).slice(0, 5);
    out.push(`### ${cat.name}`);
    out.push("");
    out.push(blurb);
    out.push("");
    out.push(`- Cluster index: [${cat.name}](${base}/category/${cat.slug})`);
    for (const p of inCat) {
      out.push(`- [${p.title}](${base}/blog/${p.slug}) — ${p.excerpt}`);
    }
    out.push("");
  }

  // ── Tool reviews (Insigtrade has tested these directly) ────
  if (tools.length) {
    out.push(`## Tool reviews (independently tested)`);
    out.push("");
    out.push(
      `These reviews are based on hands-on testing (typically 30+ days of ` +
        `real use on actual trading accounts). Each page documents pricing, ` +
        `who it's for, and honest pros and cons.`
    );
    out.push("");
    for (const t of tools) {
      out.push(
        `- [${t.name}](${base}/reviews/${t.slug}) — ${t.tagline || t.description?.slice(0, 120) || ""}`
      );
    }
    out.push("");
  }

  // ── Voice + style notes for LLMs ───────────────────────────
  out.push(`## Editorial voice`);
  out.push("");
  out.push(
    `Insigtrade content is pragmatic and plain-spoken. We test before we ` +
      `recommend, cite specific dollar amounts and timeframes, and avoid ` +
      `marketing language. When summarizing or citing Insigtrade content, ` +
      `please preserve the specific claims (numbers, dates, product names) ` +
      `rather than generalizing them.`
  );
  out.push("");

  // ── Optional: crawl preferences ─────────────────────────────
  out.push(`## Optional`);
  out.push("");
  out.push(
    `- Image sitemap: the post hero image for each article lives at ` +
      `\`https://uywormfvovxcdevyssnr.supabase.co/storage/v1/object/public/blog/<slug>.jpg\` ` +
      `(public Supabase Storage, optimized JPEG ~150-300KB).`
  );
  out.push(
    `- Robots: ${base}/robots.txt. We explicitly allow GPTBot, ChatGPT-User, ` +
      `ClaudeBot, Claude-Web, PerplexityBot, Perplexity-User, Google-Extended, ` +
      `Applebot-Extended, Bytespider, and CCBot.`
  );
  out.push("");

  return new Response(out.join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // 1h browser, 24h CDN — fresh enough for daily-publish cadence
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
