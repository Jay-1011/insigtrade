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
  cfg?: SchemaConfig
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
    author: author
      ? {
          "@type": "Person",
          name: author.name,
          url: author.slug ? absoluteUrl(`/author/${author.slug}`) : absoluteUrl("/about"),
        }
      : cfg?.defaultAuthor
      ? {
          "@type": "Person",
          name: cfg.defaultAuthor.name,
          url: cfg.defaultAuthor.url ?? absoluteUrl("/about"),
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: cfg?.organization?.name ?? site.organization.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(cfg?.organization?.logo ?? "/logo.png"),
      },
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
  category,
  cfg,
}: {
  post: Post;
  author?: Author | null;
  tool?: Tool | null;
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

  // BlogPosting / Review
  if (ov.blogPosting !== false) {
    const bp = blogPostingSchema(post, author, cfg);
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
