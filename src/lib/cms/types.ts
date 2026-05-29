// ──────────────────────────────────────────────────────────
// Insigtrade CMS, Core Types
// Backed by Supabase Postgres (see supabase/migrations/0001_init.sql).
// Data access lives in src/lib/cms/store.ts.
// ──────────────────────────────────────────────────────────

export type PostStatus = "draft" | "published" | "scheduled";
export type FunnelStage = "TOFU" | "MOFU" | "BOFU";
export type SearchIntent =
  | "informational"
  | "commercial"
  | "comparison"
  | "transactional"
  | "navigational";

export type ContentFormat =
  | "guide"
  | "tool-review"
  | "comparison"
  | "listicle"
  | "tutorial"
  | "trend"
  | "case-study"
  | "product"
  | "beginner-guide"
  | "workflow";

export type MonetizationType =
  | "affiliate"
  | "adsense"
  | "product"
  | "newsletter"
  | "none";

// ──────────────────────────────────────────────────────────
// Content Blocks (drag-drop friendly, polymorphic)
// ──────────────────────────────────────────────────────────

export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3 | 4; text: string; id?: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "callout"; variant: "info" | "warning" | "success" | "tip"; title?: string; text: string }
  | { type: "checklist"; items: string[] }
  | { type: "cta"; title: string; text?: string; ctaLabel: string; ctaHref: string; variant?: "primary" | "accent" | "dark" }
  | { type: "tool-card"; toolId: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "comparison"; tools: string[]; rows: { label: string; values: string[] }[] }
  | { type: "pros-cons"; pros: string[]; cons: string[] }
  | { type: "faq"; items: { q: string; a: string }[] }
  | { type: "code"; language?: string; code: string }
  | {
      type: "video";
      url: string;
      title?: string;
      thumbnail?: string;
      duration?: string; // ISO 8601 e.g. "PT5M30S"
      uploadDate?: string; // ISO date
      description?: string;
    }
  | { type: "internal-links"; title?: string; links: { label: string; href: string }[] }
  | { type: "newsletter" }
  | { type: "testimonial"; quote: string; author: string; role?: string }
  | { type: "key-takeaways"; items: string[] }
  | { type: "tldr"; text: string }
  | { type: "steps"; title?: string; steps: { title: string; body: string }[] }
  // HowTo emits HowTo schema automatically
  | {
      type: "how-to";
      name: string;
      description?: string;
      totalTime?: string; // ISO 8601 duration e.g. "PT30M"
      estimatedCost?: string;
      supplies?: string[];
      tools?: string[];
      steps: { name: string; text: string; image?: string; url?: string }[];
    };

// ──────────────────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────────────────

export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export interface Strategy {
  focusKeyword?: string;
  secondaryKeywords?: string[];
  intent?: SearchIntent;
  funnelStage?: FunnelStage;
  monetization?: MonetizationType;
  affiliateArticle?: boolean;
  productCta?: boolean;
  internalLinkOpportunities?: string[]; // post slugs
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  format: ContentFormat;
  status: PostStatus;
  publishedAt?: string; // ISO
  scheduledFor?: string; // ISO
  updatedAt: string;
  createdAt: string;
  authorId: string;
  categorySlug: string;
  tagSlugs: string[];
  featuredImage?: string;
  featuredImageAlt?: string;
  readTime?: string;
  blocks: Block[];
  faqs?: { q: string; a: string }[];
  seo?: SeoFields;
  strategy?: Strategy;
  // Linked review (when format = tool-review)
  reviewToolId?: string;
  // Per-post schema toggles + overrides
  schemaOverrides?: SchemaOverrides;
}

// ──────────────────────────────────────────────────────────
// Other entities
// ──────────────────────────────────────────────────────────

export interface Category {
  slug: string;
  name: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  faqs?: { q: string; a: string }[];
  pillarPostSlug?: string;
}

export interface Tag {
  slug: string;
  name: string;
  description?: string;
}

export interface Author {
  id: string;
  name: string;
  slug: string;
  role?: string;
  bio?: string;
  avatar?: string;
  twitter?: string;
  linkedin?: string;
}

export interface Tool {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  logo?: string;
  website: string;
  affiliateUrl?: string;
  pricing: string;
  rating: number; // 0-5
  features: string[];
  pros: string[];
  cons: string[];
  useCases: string[];
  verdict?: string;
  badge?: string;
}

export interface AffiliateLink {
  id: string;
  label: string;
  url: string;
  partner: string;
  notes?: string;
  clickCount?: number;
}

export interface Keyword {
  id: string;
  keyword: string;
  volume?: number;
  difficulty?: number; // 0-100
  intent?: SearchIntent;
  cluster?: string;
  funnelStage?: FunnelStage;
  priority?: "low" | "medium" | "high";
  suggestedTitle?: string;
  competitorUrls?: string[];
  monetization?: MonetizationType;
  status: "idea" | "writing" | "published" | "update";
  linkedPostSlug?: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
}

export interface Collaboration {
  id: string;
  brand: string;
  logo?: string;
  link?: string;
  description?: string;
}

export interface CtaBlock {
  id: string;
  title: string;
  text: string;
  ctaLabel: string;
  ctaHref: string;
  variant?: "primary" | "accent" | "dark";
}

// ──────────────────────────────────────────────────────────
// Schema management
// ──────────────────────────────────────────────────────────

/** Global JSON-LD config, managed at /admin/schemas */
export interface SchemaConfig {
  organization: {
    name: string;
    legalName?: string;
    logo?: string;
    foundingDate?: string;
    sameAs: string[]; // social profiles
    contactPoint?: {
      email?: string;
      telephone?: string;
      contactType?: string;
    };
  };
  website: {
    name: string;
    description: string;
    inLanguage: string;
    enableSearchAction: boolean;
  };
  defaultAuthor?: {
    name: string;
    url?: string;
    sameAs?: string[];
  };
}

/** Per-post schema toggles + overrides */
export interface SchemaOverrides {
  // Toggle which schemas emit on this post
  emit?: {
    blogPosting?: boolean; // default true
    breadcrumb?: boolean;  // default true
    faq?: boolean;          // default true (when faqs[] exist)
    review?: boolean;       // default true (when format=tool-review)
    howTo?: boolean;        // default true (when how-to block exists)
    videoObject?: boolean;  // default true (when video block exists)
    article?: boolean;      // default false (use BlogPosting unless explicitly Article)
  };
  // Manual field overrides
  blogPosting?: {
    headline?: string;
    description?: string;
    image?: string;
    keywords?: string;
  };
  // Aggregate rating override (for review-style posts)
  aggregateRating?: {
    ratingValue: number;
    bestRating?: number;
    ratingCount: number;
  };
  // Custom JSON-LD blocks the editor can paste in
  customJsonLd?: Record<string, unknown>[];
}
