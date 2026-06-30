import type { MetadataRoute } from "next";
import { site } from "@/lib/seo/site";

// We allow every reputable crawler (search + AI). LLMs like Anthropic's
// ClaudeBot, Perplexity, OpenAI's GPTBot, and Google-Extended explicitly
// look for User-agent + /llms.txt before deciding what to ingest.
//
// /admin and /api are kept off-limits to all bots.

export default function robots(): MetadataRoute.Robots {
  const base = site.url.replace(/\/$/, "");
  return {
    rules: [
      // Generic
      { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },

      // AI / answer-engine crawlers — explicitly welcome them and point
      // at the same canonical content. Listing them is a positive signal
      // even though "allow" is the default behavior.
      { userAgent: "GPTBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "ChatGPT-User", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "ClaudeBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Claude-Web", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "PerplexityBot", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Perplexity-User", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Google-Extended", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Applebot-Extended", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "Bytespider", allow: "/", disallow: ["/admin", "/api"] },
      { userAgent: "CCBot", allow: "/", disallow: ["/admin", "/api"] },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
    ],
    host: site.url,
  };
}
