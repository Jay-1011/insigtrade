// Dynamic JSON-LD generators. NEVER emit empty/falsy fields.
// All emitters honor /admin/schemas global config + per-post overrides.

import { site, absoluteUrl } from "@/lib/seo/site";
import type { Author, Block, Post, SchemaConfig, Tool } from "@/lib/cms/types";

type Json = Record<string, unknown>;

function clean<T extends Json>(obj: T): T {
  const out: Json = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const c = clean(v as Json);
      if (Object.keys(c).length) out[k] = c;
    } else if (typeof v === "string" && v.trim() === "") {
      continue;
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

// ──────────────────────────────────────────────────────────
// Site-wide
// ──────────────────────────────────────────────────────────

export function organizationSchema(cfg?: SchemaConfig) {
  const org = cfg?.organization;
  return clean({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: org?.name ?? site.organization.name,
    legalName: org?.legalName ?? site.organization.legalName,
    url: site.url,
    logo: org?.logo ? absoluteUrl(org.logo) : absoluteUrl("/logo.png"),
    sameAs: org?.sameAs ?? site.organization.sameAs,
    foundingDate: org?.foundingDate ?? site.organization.foundingDate,
    contactPoint:
      org?.contactPoint && (org.contactPoint.email || org.contactPoint.telephone)
        ? {
            "@type": "ContactPoint",
            email: org.contactPoint.email,
            telephone: org.contactPoint.telephone,
            contactType: org.contactPoint.contactType ?? "customer support",
          }
        : undefined,
  });
}

export function websiteSchema(cfg?: SchemaConfig) {
  const wb = cfg?.website;
  return clean({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: wb?.name ?? site.name,
    url: site.url,
    description: wb?.description ?? site.description,
    inLanguage: wb?.inLanguage ?? "en-US",
    potentialAction:
      (wb?.enableSearchAction ?? true)
        ? {
            "@type": "SearchAction",
            target: `${site.url}/blog?search={search_term_string}`,
            "query-input": "required name=search_term_string",
          }
        : undefined,
  });
}

export function breadcrumbSchema(items: { name: string; href: string }[]) {
  if (!items.length) return null;
  return clean({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.href),
    })),
  });
}

// ──────────────────────────────────────────────────────────
// BlogPosting / Article
// ──────────────────────────────────────────────────────────

export function blogPostingSchema(
  post: Post,
  author?: Author | null,
  cfg?: SchemaConfig,
  category?: { slug: string; name: string } | null,
  tools?: Tool[]
) {
  if (!post.title) return null;
  const ov = post.schemaOverrides?.blogPosting;
  const useArticleType = post.schemaOverrides?.emit?.article === true;

  // Image fallback chain:
  //   1. schema override
  //   2. post.featuredImage
  //   3. per-post dynamic OG image (/blog/<slug>/opengraph-image)
  // Google needs an image URL to grant rich-result eligibility.
  const imageUrl =
    ov?.image ??
    post.featuredImage ??
    absoluteUrl(`/blog/${post.slug}/opengraph-image`);

  // Word count + plain-text summary derived from blocks.
  // LLMs use these to size-up the page before deciding to cite.
  const wordCount = countWords(post.blocks ?? []);
  const articleBody = extractArticleBody(post.blocks ?? []);

  // Entity tags ("mentions") help LLMs + AI search understand what real
  // products/services the article discusses. about = the broader topic.
  const mentions = collectMentions(post, tools);

  return clean({
    "@context": "https://schema.org",
    "@type":
      post.format === "tool-review"
        ? "Review"
        : useArticleType
        ? "Article"
        : "BlogPosting",
    headline: ov?.headline ?? post.title,
    description: ov?.description ?? post.excerpt,
    image: absoluteUrl(imageUrl),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: cfg?.website?.inLanguage ?? "en-US",
    wordCount: wordCount || undefined,
    articleBody: articleBody || undefined,
    articleSection: category?.name ?? post.categorySlug,
    // about = the broad topic (cluster); mentions = entities cited within
    about: category
      ? { "@type": "Thing", name: category.name, url: absoluteUrl(`/category/${category.slug}`) }
      : undefined,
    mentions: mentions.length ? mentions : undefined,
    author: buildAuthorEntity(post, author, cfg),
    publisher: buildPublisherEntity(cfg),
    // Speakable: lets Cortana / Alexa / future voice surfaces read the
    // TL;DR + key-takeaways aloud. The CSS selectors match data-speakable
    // attributes the BlockRenderer emits.
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".speakable-summary", ".speakable-takeaways"],
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    keywords:
      ov?.keywords ??
      [
        ...(post.strategy?.focusKeyword ? [post.strategy.focusKeyword] : []),
        ...(post.strategy?.secondaryKeywords ?? []),
      ].join(", "),
  });
}

// ──────────────────────────────────────────────────────────
// Helpers that build the deeper entity blocks
// ──────────────────────────────────────────────────────────

const CLUSTER_EXPERTISE: Record<string, string[]> = {
  "ai-for-traders": ["AI trading tools", "ChatGPT for stock research", "Perplexity finance workflows"],
  "trading-automation": ["No-code trading automation", "TradingView webhooks", "Make.com workflows"],
  "trader-productivity": ["Trade journaling", "Notion templates for traders", "Trading routines"],
  "market-research": ["Stock screeners", "Earnings prep", "Sentiment analysis"],
  "wealth-systems": ["AI for solopreneurs", "Side-hustle automation", "Import-export intelligence"],
};

function buildAuthorEntity(
  post: Post,
  author: Author | null | undefined,
  cfg: SchemaConfig | undefined
): Json {
  const cluster = post.categorySlug ?? "";
  const knowsAbout = CLUSTER_EXPERTISE[cluster] ?? [
    "AI tools for traders",
    "Trading automation",
    "Quantitative finance workflows",
  ];

  if (author) {
    return {
      "@type": "Person",
      name: author.name,
      url: author.slug ? absoluteUrl(`/author/${author.slug}`) : absoluteUrl("/about"),
      jobTitle: author.role,
      description: author.bio,
      image: author.avatar ? absoluteUrl(author.avatar) : undefined,
      sameAs: [
        author.twitter ? `https://twitter.com/${author.twitter.replace(/^@/, "")}` : undefined,
        author.linkedin ? `https://www.linkedin.com/in/${author.linkedin}` : undefined,
      ].filter(Boolean),
      knowsAbout,
      worksFor: {
        "@type": "Organization",
        name: cfg?.organization?.name ?? site.organization.name,
        url: site.url,
      },
    };
  }

  return {
    "@type": "Person",
    name: cfg?.defaultAuthor?.name ?? site.organization.founder,
    url: cfg?.defaultAuthor?.url ?? absoluteUrl("/about"),
    knowsAbout,
    worksFor: {
      "@type": "Organization",
      name: cfg?.organization?.name ?? site.organization.name,
      url: site.url,
    },
    sameAs: cfg?.defaultAuthor?.sameAs,
  };
}

function buildPublisherEntity(cfg: SchemaConfig | undefined): Json {
  return {
    "@type": "Organization",
    name: cfg?.organization?.name ?? site.organization.name,
    legalName: cfg?.organization?.legalName ?? site.organization.legalName,
    url: site.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl(cfg?.organization?.logo ?? "/logo.png"),
    },
    sameAs: cfg?.organization?.sameAs ?? site.organization.sameAs,
    knowsAbout: [
      "AI tools for traders",
      "No-code trading automation",
      "Stock screeners and market research",
      "Trader productivity systems",
      "Trading journals",
    ],
    audience: {
      "@type": "Audience",
      audienceType:
        "Beginner-to-intermediate retail traders, AI-curious finance professionals, and solopreneurs",
    },
  };
}

/**
 * Collect entities the article mentions, so LLMs and AI search engines
 * can understand topical scope. Sources:
 *   - the linked tool (for tool-review posts) → SoftwareApplication
 *   - any other Tool whose `name` appears in the article text
 *   - common product mentions detected in prose (TradingView, Notion, etc.)
 */
function collectMentions(post: Post, tools?: Tool[]): Json[] {
  const text = extractArticleBody(post.blocks ?? []).toLowerCase();
  const out: Json[] = [];

  if (Array.isArray(tools)) {
    for (const t of tools) {
      if (!t?.name) continue;
      if (text.includes(t.name.toLowerCase())) {
        out.push({
          "@type": "SoftwareApplication",
          name: t.name,
          applicationCategory: t.category,
          url: t.website || undefined,
        });
      }
    }
  }

  // Hard-coded list of widely-cited products so we tag mentions even when
  // they aren't in the tools table. These help GEO — LLMs recognize the
  // entity and link the citation back to the article.
  const wellKnownProducts: { name: string; category?: string; url?: string }[] = [
    { name: "TradingView", category: "FinanceApplication", url: "https://www.tradingview.com" },
    { name: "ChatGPT", category: "AIAssistant", url: "https://openai.com/chatgpt" },
    { name: "Claude", category: "AIAssistant", url: "https://claude.ai" },
    { name: "Perplexity", category: "AIAssistant", url: "https://www.perplexity.ai" },
    { name: "Notion", category: "ProductivityApplication", url: "https://www.notion.so" },
    { name: "Make.com", category: "WorkflowAutomation", url: "https://www.make.com" },
    { name: "Zapier", category: "WorkflowAutomation", url: "https://zapier.com" },
    { name: "TradeZella", category: "FinanceApplication", url: "https://tradezella.com" },
    { name: "Tradervue", category: "FinanceApplication", url: "https://www.tradervue.com" },
    { name: "Discord", category: "CommunicationApplication", url: "https://discord.com" },
  ];
  for (const p of wellKnownProducts) {
    if (text.includes(p.name.toLowerCase()) && !out.some((m) => (m as { name?: string }).name === p.name)) {
      out.push({
        "@type": "SoftwareApplication",
        name: p.name,
        applicationCategory: p.category,
        url: p.url,
      });
    }
  }

  return out;
}

/** Total word count across paragraph + heading + list block text. */
function countWords(blocks: Block[]): number {
  let n = 0;
  const add = (s: unknown) => {
    if (typeof s !== "string") return;
    n += s.trim().split(/\s+/).filter(Boolean).length;
  };
  for (const b of blocks) {
    const block = b as Record<string, unknown>;
    add(block.text);
    if (Array.isArray(block.items))
      for (const it of block.items) add(typeof it === "string" ? it : "");
    if (Array.isArray(block.steps))
      for (const s of block.steps) {
        const step = s as Record<string, unknown>;
        add(step.title);
        add(step.body);
        add(step.text);
      }
    if (Array.isArray(block.pros))
      for (const it of block.pros) add(typeof it === "string" ? it : "");
    if (Array.isArray(block.cons))
      for (const it of block.cons) add(typeof it === "string" ? it : "");
    if (Array.isArray(block.rows))
      for (const row of block.rows)
        if (Array.isArray(row)) for (const cell of row) add(typeof cell === "string" ? cell : "");
  }
  return n;
}

/**
 * Plain-text article body — first N words of paragraph + tldr content.
 * Used for schema.org `articleBody` so LLM crawlers can read a clean
 * extract without parsing the HTML.
 */
function extractArticleBody(blocks: Block[], maxWords = 220): string {
  const chunks: string[] = [];
  for (const b of blocks) {
    if ((b as { type: string }).type === "tldr" && (b as { text: string }).text) {
      chunks.push((b as { text: string }).text);
    }
    if ((b as { type: string }).type === "paragraph" && (b as { text: string }).text) {
      chunks.push((b as { text: string }).text);
    }
  }
  const joined = chunks.join(" ").replace(/\s+/g, " ").trim();
  const words = joined.split(" ");
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") + "…" : joined;
}

// ──────────────────────────────────────────────────────────
// FAQPage
// ──────────────────────────────────────────────────────────

export function faqSchema(items: { q: string; a: string }[] | undefined) {
  if (!items || items.length === 0) return null;
  return clean({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  });
}

// ──────────────────────────────────────────────────────────
// SoftwareApplication / Review (for tool reviews)
// ──────────────────────────────────────────────────────────

export function softwareSchema(tool: Tool) {
  if (!tool?.name) return null;
  return clean({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.description,
    applicationCategory: tool.category,
    operatingSystem: "Web",
    url: tool.website,
    offers: tool.pricing
      ? {
          "@type": "Offer",
          price: extractPrice(tool.pricing),
          priceCurrency: "USD",
        }
      : undefined,
    aggregateRating:
      tool.rating > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: tool.rating,
            bestRating: 5,
            ratingCount: 1,
          }
        : undefined,
  });
}

export function reviewSchema(
  tool: Tool,
  post: Post,
  author?: Author | null
) {
  if (!tool || !post) return null;
  const ovRating = post.schemaOverrides?.aggregateRating;
  return clean({
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "SoftwareApplication",
      name: tool.name,
      applicationCategory: tool.category,
      url: tool.website,
    },
    reviewRating:
      tool.rating > 0
        ? {
            "@type": "Rating",
            ratingValue: tool.rating,
            bestRating: 5,
          }
        : undefined,
    aggregateRating: ovRating
      ? {
          "@type": "AggregateRating",
          ratingValue: ovRating.ratingValue,
          bestRating: ovRating.bestRating ?? 5,
          ratingCount: ovRating.ratingCount,
        }
      : undefined,
    name: post.title,
    reviewBody: post.excerpt,
    author: author
      ? { "@type": "Person", name: author.name }
      : { "@type": "Organization", name: site.name },
    datePublished: post.publishedAt,
  });
}

// ──────────────────────────────────────────────────────────
// HowTo (auto from how-to blocks)
// ──────────────────────────────────────────────────────────

export function howToSchema(block: Extract<Block, { type: "how-to" }>) {
  if (!block.steps?.length) return null;
  return clean({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: block.name,
    description: block.description,
    totalTime: block.totalTime,
    estimatedCost: block.estimatedCost
      ? { "@type": "MonetaryAmount", currency: "USD", value: block.estimatedCost }
      : undefined,
    supply: block.supplies?.map((s) => ({ "@type": "HowToSupply", name: s })),
    tool: block.tools?.map((t) => ({ "@type": "HowToTool", name: t })),
    step: block.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      image: s.image ? absoluteUrl(s.image) : undefined,
      url: s.url,
    })),
  });
}

// ──────────────────────────────────────────────────────────
// VideoObject (auto from video blocks with metadata)
// ──────────────────────────────────────────────────────────

export function videoObjectSchema(
  block: Extract<Block, { type: "video" }>,
  post: Post
) {
  if (!block.url || !block.title) return null; // require minimum fields
  return clean({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: block.title,
    description: block.description ?? post.excerpt,
    thumbnailUrl: block.thumbnail ? absoluteUrl(block.thumbnail) : undefined,
    uploadDate: block.uploadDate ?? post.publishedAt,
    duration: block.duration,
    embedUrl: block.url,
  });
}

// ──────────────────────────────────────────────────────────
// Person (author profile)
// ──────────────────────────────────────────────────────────

export function personSchema(author: Author) {
  if (!author?.name) return null;
  return clean({
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    description: author.bio,
    image: author.avatar ? absoluteUrl(author.avatar) : undefined,
    url: author.slug ? absoluteUrl(`/author/${author.slug}`) : undefined,
    sameAs: [
      author.twitter && `https://twitter.com/${author.twitter.replace("@", "")}`,
      author.linkedin,
    ].filter(Boolean) as string[],
  });
}

// ──────────────────────────────────────────────────────────
// Orchestrator: build all schemas for a post in one place
// ──────────────────────────────────────────────────────────

export function buildPostSchemas({
  post,
  author,
  tool,
  tools,
  category,
  cfg,
}: {
  post: Post;
  author?: Author | null;
  tool?: Tool | null;
  /** Full tools list — used to detect mentions for AEO/GEO entity tagging. */
  tools?: Tool[];
  category?: { slug: string; name: string } | null;
  cfg?: SchemaConfig;
}): unknown[] {
  const ov = post.schemaOverrides?.emit ?? {};
  const out: unknown[] = [];

  // Breadcrumb
  if (ov.breadcrumb !== false) {
    const bc = breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "Blog", href: "/blog" },
      ...(category ? [{ name: category.name, href: `/category/${category.slug}` }] : []),
      { name: post.title, href: `/blog/${post.slug}` },
    ]);
    if (bc) out.push(bc);
  }

  // BlogPosting / Review (now passes category + tools for mentions/about)
  if (ov.blogPosting !== false) {
    const bp = blogPostingSchema(post, author, cfg, category, tools);
    if (bp) out.push(bp);
  }

  // Review (only if format is tool-review and a tool is linked)
  if (ov.review !== false && post.format === "tool-review" && tool) {
    const rev = reviewSchema(tool, post, author);
    if (rev) out.push(rev);
  }

  // FAQ
  if (ov.faq !== false) {
    const fq = faqSchema(post.faqs);
    if (fq) out.push(fq);
  }

  // HowTo (one per how-to block)
  if (ov.howTo !== false) {
    for (const b of post.blocks) {
      if (b.type === "how-to") {
        const ht = howToSchema(b);
        if (ht) out.push(ht);
      }
    }
  }

  // VideoObject (one per qualifying video block)
  if (ov.videoObject !== false) {
    for (const b of post.blocks) {
      if (b.type === "video") {
        const v = videoObjectSchema(b, post);
        if (v) out.push(v);
      }
    }
  }

  // Custom JSON-LD blobs (admin-pasted)
  for (const c of post.schemaOverrides?.customJsonLd ?? []) {
    if (c && Object.keys(c).length) out.push(c);
  }

  return out;
}

// ──────────────────────────────────────────────────────────
// Validation: returns warnings the admin should know about
// ──────────────────────────────────────────────────────────

export function validatePostSchemas(post: Post): string[] {
  const warnings: string[] = [];
  if (!post.title) warnings.push("Missing title (BlogPosting.headline required)");
  if (!post.excerpt) warnings.push("Missing excerpt (BlogPosting.description recommended)");
  if (!post.publishedAt && post.status === "published") warnings.push("Published post missing publishedAt date");
  if (!post.featuredImage) warnings.push("No featured image (BlogPosting.image recommended for rich results)");
  if (post.format === "tool-review" && !post.reviewToolId)
    warnings.push("Format is 'tool-review' but no tool is linked, Review schema will be skipped");
  for (const b of post.blocks) {
    if (b.type === "how-to" && (!b.name || !b.steps?.length))
      warnings.push("HowTo block missing name or steps, HowTo schema will be skipped");
    if (b.type === "video" && b.url && !b.title)
      warnings.push("Video block missing title, VideoObject schema will be skipped");
  }
  return warnings;
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

function extractPrice(p: string): string {
  const m = p.match(/(\d+(\.\d+)?)/);
  return m ? m[1] : "0";
}
