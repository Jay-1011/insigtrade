// ──────────────────────────────────────────────────────────
// Supabase-backed CMS store.
// Keeps the same exported function signatures as the previous file-based
// store, so server actions and pages don't need to change. All access
// goes through the service-role client (server-only).
// ──────────────────────────────────────────────────────────

import "server-only";
import slugify from "slugify";
import { db } from "@/lib/supabase/server";
import type {
  Author,
  Block,
  Category,
  Keyword,
  Post,
  SchemaConfig,
  SchemaOverrides,
  SeoFields,
  Strategy,
  Tag,
  Testimonial,
  Tool,
} from "./types";

export const slugifyStr = (s: string) =>
  slugify(s, { lower: true, strict: true, trim: true });

// ──────────────────────────────────────────────────────────
// Row ↔ entity mappers (snake_case DB ↔ camelCase TS)
// ──────────────────────────────────────────────────────────

interface PostRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string;
  format: string;
  status: string;
  published_at: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  category_slug: string | null;
  featured_image: string | null;
  featured_image_alt: string | null;
  read_time: string | null;
  blocks: Block[] | null;
  faqs: { q: string; a: string }[] | null;
  seo: SeoFields | null;
  strategy: Strategy | null;
  review_tool_id: string | null;
  schema_overrides: SchemaOverrides | null;
  post_tags?: { tag_slug: string }[];
}

function rowToPost(r: PostRow): Post {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle ?? undefined,
    excerpt: r.excerpt ?? "",
    format: r.format as Post["format"],
    status: r.status as Post["status"],
    publishedAt: r.published_at ?? undefined,
    scheduledFor: r.scheduled_for ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    authorId: r.author_id ?? "team",
    categorySlug: r.category_slug ?? "",
    tagSlugs: (r.post_tags ?? []).map((t) => t.tag_slug),
    featuredImage: r.featured_image ?? undefined,
    featuredImageAlt: r.featured_image_alt ?? undefined,
    readTime: r.read_time ?? undefined,
    blocks: r.blocks ?? [],
    faqs: r.faqs ?? [],
    seo: r.seo ?? undefined,
    strategy: r.strategy ?? undefined,
    reviewToolId: r.review_tool_id ?? undefined,
    schemaOverrides: r.schema_overrides ?? undefined,
  };
}

function postToRow(p: Post): Omit<PostRow, "post_tags"> {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    subtitle: p.subtitle ?? null,
    excerpt: p.excerpt ?? "",
    format: p.format,
    status: p.status,
    published_at: p.publishedAt ?? null,
    scheduled_for: p.scheduledFor ?? null,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
    author_id: p.authorId && p.authorId !== "team" ? p.authorId : null,
    category_slug: p.categorySlug || null,
    featured_image: p.featuredImage ?? null,
    featured_image_alt: p.featuredImageAlt ?? null,
    read_time: p.readTime ?? null,
    blocks: p.blocks ?? [],
    faqs: p.faqs ?? [],
    seo: p.seo ?? null,
    strategy: p.strategy ?? null,
    review_tool_id: p.reviewToolId ?? null,
    schema_overrides: p.schemaOverrides ?? null,
  };
}

const POST_SELECT = "*,post_tags(tag_slug)";

// ──────────────────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await db()
    .from("posts")
    .select(POST_SELECT)
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[cms] getAllPosts:", error);
    return [];
  }
  return (data as PostRow[]).map(rowToPost);
}

export async function getPublishedPosts(): Promise<Post[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await db()
    .from("posts")
    .select(POST_SELECT)
    .or(
      `status.eq.published,and(status.eq.scheduled,scheduled_for.lte.${nowIso})`
    )
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[cms] getPublishedPosts:", error);
    return [];
  }
  return (data as PostRow[]).map(rowToPost);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const { data, error } = await db()
    .from("posts")
    .select(POST_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) {
    console.error("[cms] getPostBySlug:", error);
    return null;
  }
  return data ? rowToPost(data as PostRow) : null;
}

export async function savePost(post: Post): Promise<Post> {
  post.updatedAt = new Date().toISOString();
  if (!post.slug) post.slug = slugifyStr(post.title);
  if (!post.createdAt) post.createdAt = post.updatedAt;

  const row = postToRow(post);
  const { error: upsertErr } = await db()
    .from("posts")
    .upsert(row, { onConflict: "id" });
  if (upsertErr) throw new Error(`savePost: ${upsertErr.message}`);

  // Replace tag links
  await db().from("post_tags").delete().eq("post_id", post.id);
  if (post.tagSlugs && post.tagSlugs.length) {
    const links = post.tagSlugs.map((t) => ({ post_id: post.id, tag_slug: t }));
    const { error: linkErr } = await db().from("post_tags").insert(links);
    if (linkErr) console.error("[cms] post_tags insert:", linkErr);
  }
  return post;
}

export async function deletePost(slug: string) {
  await db().from("posts").delete().eq("slug", slug);
}

// ──────────────────────────────────────────────────────────
// Categories / Tags / Authors
// ──────────────────────────────────────────────────────────

interface CategoryRow {
  slug: string;
  name: string;
  description: string;
  seo_title: string | null;
  seo_description: string | null;
  faqs: { q: string; a: string }[];
  pillar_post_slug: string | null;
}
const rowToCategory = (r: CategoryRow): Category => ({
  slug: r.slug,
  name: r.name,
  description: r.description ?? "",
  seoTitle: r.seo_title ?? undefined,
  seoDescription: r.seo_description ?? undefined,
  faqs: r.faqs ?? [],
  pillarPostSlug: r.pillar_post_slug ?? undefined,
});
const categoryToRow = (c: Category): CategoryRow => ({
  slug: c.slug,
  name: c.name,
  description: c.description ?? "",
  seo_title: c.seoTitle ?? null,
  seo_description: c.seoDescription ?? null,
  faqs: c.faqs ?? [],
  pillar_post_slug: c.pillarPostSlug ?? null,
});

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await db().from("categories").select("*").order("name");
  if (error) {
    console.error("[cms] getCategories:", error);
    return [];
  }
  return (data as CategoryRow[]).map(rowToCategory);
}
export async function getCategoryBySlug(slug: string) {
  const { data } = await db()
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? rowToCategory(data as CategoryRow) : null;
}
export async function saveCategory(c: Category) {
  const { error } = await db()
    .from("categories")
    .upsert(categoryToRow(c), { onConflict: "slug" });
  if (error) throw new Error(`saveCategory: ${error.message}`);
  return c;
}
export async function deleteCategory(slug: string) {
  await db().from("categories").delete().eq("slug", slug);
}

interface TagRow {
  slug: string;
  name: string;
  description: string | null;
}
const rowToTag = (r: TagRow): Tag => ({
  slug: r.slug,
  name: r.name,
  description: r.description ?? undefined,
});

export async function getTags(): Promise<Tag[]> {
  const { data, error } = await db().from("tags").select("*").order("name");
  if (error) {
    console.error("[cms] getTags:", error);
    return [];
  }
  return (data as TagRow[]).map(rowToTag);
}
export async function getTagBySlug(slug: string) {
  const { data } = await db()
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? rowToTag(data as TagRow) : null;
}
export async function saveTag(t: Tag) {
  const { error } = await db()
    .from("tags")
    .upsert(
      { slug: t.slug, name: t.name, description: t.description ?? null },
      { onConflict: "slug" }
    );
  if (error) throw new Error(`saveTag: ${error.message}`);
  return t;
}
export async function deleteTag(slug: string) {
  await db().from("tags").delete().eq("slug", slug);
}

interface AuthorRow {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  bio: string | null;
  avatar: string | null;
  twitter: string | null;
  linkedin: string | null;
}
const rowToAuthor = (r: AuthorRow): Author => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  role: r.role ?? undefined,
  bio: r.bio ?? undefined,
  avatar: r.avatar ?? undefined,
  twitter: r.twitter ?? undefined,
  linkedin: r.linkedin ?? undefined,
});
export async function getAuthors(): Promise<Author[]> {
  const { data, error } = await db().from("authors").select("*").order("name");
  if (error) {
    console.error("[cms] getAuthors:", error);
    return [];
  }
  return (data as AuthorRow[]).map(rowToAuthor);
}
export async function getAuthorById(id: string) {
  const { data } = await db().from("authors").select("*").eq("id", id).maybeSingle();
  return data ? rowToAuthor(data as AuthorRow) : null;
}
export async function saveAuthor(a: Author) {
  const { error } = await db()
    .from("authors")
    .upsert(
      {
        id: a.id,
        slug: a.slug,
        name: a.name,
        role: a.role ?? null,
        bio: a.bio ?? null,
        avatar: a.avatar ?? null,
        twitter: a.twitter ?? null,
        linkedin: a.linkedin ?? null,
      },
      { onConflict: "id" }
    );
  if (error) throw new Error(`saveAuthor: ${error.message}`);
  return a;
}

// ──────────────────────────────────────────────────────────
// Tools
// ──────────────────────────────────────────────────────────

interface ToolRow {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  logo: string | null;
  website: string;
  affiliate_url: string | null;
  pricing: string;
  rating: number;
  features: string[];
  pros: string[];
  cons: string[];
  use_cases: string[];
  verdict: string | null;
  badge: string | null;
}
const rowToTool = (r: ToolRow): Tool => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  tagline: r.tagline,
  description: r.description,
  category: r.category,
  logo: r.logo ?? undefined,
  website: r.website,
  affiliateUrl: r.affiliate_url ?? undefined,
  pricing: r.pricing,
  rating: Number(r.rating ?? 0),
  features: r.features ?? [],
  pros: r.pros ?? [],
  cons: r.cons ?? [],
  useCases: r.use_cases ?? [],
  verdict: r.verdict ?? undefined,
  badge: r.badge ?? undefined,
});
const toolToRow = (t: Tool): ToolRow => ({
  id: t.id,
  slug: t.slug,
  name: t.name,
  tagline: t.tagline ?? "",
  description: t.description ?? "",
  category: t.category ?? "",
  logo: t.logo ?? null,
  website: t.website ?? "",
  affiliate_url: t.affiliateUrl ?? null,
  pricing: t.pricing ?? "",
  rating: t.rating ?? 0,
  features: t.features ?? [],
  pros: t.pros ?? [],
  cons: t.cons ?? [],
  use_cases: t.useCases ?? [],
  verdict: t.verdict ?? null,
  badge: t.badge ?? null,
});

export async function getTools(): Promise<Tool[]> {
  const { data, error } = await db().from("tools").select("*").order("name");
  if (error) {
    console.error("[cms] getTools:", error);
    return [];
  }
  return (data as ToolRow[]).map(rowToTool);
}
export async function getToolById(id: string) {
  const { data } = await db().from("tools").select("*").eq("id", id).maybeSingle();
  return data ? rowToTool(data as ToolRow) : null;
}
export async function getToolBySlug(slug: string) {
  const { data } = await db().from("tools").select("*").eq("slug", slug).maybeSingle();
  return data ? rowToTool(data as ToolRow) : null;
}
export async function saveTool(t: Tool) {
  if (!t.slug) t.slug = slugifyStr(t.name);
  const { error } = await db()
    .from("tools")
    .upsert(toolToRow(t), { onConflict: "id" });
  if (error) throw new Error(`saveTool: ${error.message}`);
  return t;
}
export async function deleteTool(id: string) {
  await db().from("tools").delete().eq("id", id);
}

// ──────────────────────────────────────────────────────────
// Keywords
// ──────────────────────────────────────────────────────────

interface KeywordRow {
  id: string;
  keyword: string;
  volume: number | null;
  difficulty: number | null;
  intent: string | null;
  cluster: string | null;
  funnel_stage: string | null;
  priority: string | null;
  suggested_title: string | null;
  competitor_urls: string[];
  monetization: string | null;
  status: string;
  linked_post_slug: string | null;
}
const rowToKeyword = (r: KeywordRow): Keyword => ({
  id: r.id,
  keyword: r.keyword,
  volume: r.volume ?? undefined,
  difficulty: r.difficulty ?? undefined,
  intent: (r.intent as Keyword["intent"]) ?? undefined,
  cluster: r.cluster ?? undefined,
  funnelStage: (r.funnel_stage as Keyword["funnelStage"]) ?? undefined,
  priority: (r.priority as Keyword["priority"]) ?? undefined,
  suggestedTitle: r.suggested_title ?? undefined,
  competitorUrls: r.competitor_urls ?? [],
  monetization: (r.monetization as Keyword["monetization"]) ?? undefined,
  status: r.status as Keyword["status"],
  linkedPostSlug: r.linked_post_slug ?? undefined,
});
const keywordToRow = (k: Keyword): KeywordRow => ({
  id: k.id,
  keyword: k.keyword,
  volume: k.volume ?? null,
  difficulty: k.difficulty ?? null,
  intent: k.intent ?? null,
  cluster: k.cluster ?? null,
  funnel_stage: k.funnelStage ?? null,
  priority: k.priority ?? null,
  suggested_title: k.suggestedTitle ?? null,
  competitor_urls: k.competitorUrls ?? [],
  monetization: k.monetization ?? null,
  status: k.status,
  linked_post_slug: k.linkedPostSlug ?? null,
});

export async function getKeywords(): Promise<Keyword[]> {
  const { data, error } = await db().from("keywords").select("*").order("keyword");
  if (error) {
    console.error("[cms] getKeywords:", error);
    return [];
  }
  return (data as KeywordRow[]).map(rowToKeyword);
}
export async function getKeywordById(id: string) {
  const { data } = await db().from("keywords").select("*").eq("id", id).maybeSingle();
  return data ? rowToKeyword(data as KeywordRow) : null;
}
export async function saveKeyword(k: Keyword) {
  const { error } = await db()
    .from("keywords")
    .upsert(keywordToRow(k), { onConflict: "id" });
  if (error) throw new Error(`saveKeyword: ${error.message}`);
  return k;
}
export async function deleteKeyword(id: string) {
  await db().from("keywords").delete().eq("id", id);
}

// ──────────────────────────────────────────────────────────
// Testimonials
// ──────────────────────────────────────────────────────────

interface TestimonialRow {
  id: string;
  quote: string;
  author: string;
  role: string | null;
  avatar: string | null;
}
export async function getTestimonials(): Promise<Testimonial[]> {
  const { data, error } = await db().from("testimonials").select("*");
  if (error) {
    console.error("[cms] getTestimonials:", error);
    return [];
  }
  return (data as TestimonialRow[]).map((r) => ({
    id: r.id,
    quote: r.quote,
    author: r.author,
    role: r.role ?? undefined,
    avatar: r.avatar ?? undefined,
  }));
}

// ──────────────────────────────────────────────────────────
// Schema config (singleton)
// ──────────────────────────────────────────────────────────

const DEFAULT_SCHEMA_CONFIG: SchemaConfig = {
  organization: {
    name: "Insigtrade",
    legalName: "Insigtrade Media",
    logo: "/logo.png",
    foundingDate: "2026",
    sameAs: [
      "https://twitter.com/insigtrade",
      "https://www.linkedin.com/company/insigtrade",
    ],
    contactPoint: { contactType: "customer support" },
  },
  website: {
    name: "Insigtrade",
    description:
      "AI tools, automation systems and modern workflows for self-directed traders.",
    inLanguage: "en-US",
    enableSearchAction: true,
  },
  defaultAuthor: {
    name: "Insigtrade Team",
  },
};

export async function getSchemaConfig(): Promise<SchemaConfig> {
  const { data, error } = await db()
    .from("schema_config")
    .select("*")
    .eq("id", "global")
    .maybeSingle();
  if (error || !data) return DEFAULT_SCHEMA_CONFIG;
  const row = data as {
    organization: SchemaConfig["organization"];
    website: SchemaConfig["website"];
    default_author: SchemaConfig["defaultAuthor"] | null;
  };
  return {
    organization: {
      ...DEFAULT_SCHEMA_CONFIG.organization,
      ...row.organization,
    },
    website: { ...DEFAULT_SCHEMA_CONFIG.website, ...row.website },
    defaultAuthor: {
      ...DEFAULT_SCHEMA_CONFIG.defaultAuthor!,
      ...(row.default_author ?? {}),
    },
  };
}

export async function saveSchemaConfig(cfg: SchemaConfig) {
  const { error } = await db()
    .from("schema_config")
    .upsert(
      {
        id: "global",
        organization: cfg.organization,
        website: cfg.website,
        default_author: cfg.defaultAuthor ?? null,
      },
      { onConflict: "id" }
    );
  if (error) throw new Error(`saveSchemaConfig: ${error.message}`);
  return cfg;
}

// ──────────────────────────────────────────────────────────
// Stats (admin dashboard)
// ──────────────────────────────────────────────────────────

export async function getDashboardStats() {
  const [posts, categories, tags, tools, keywords] = await Promise.all([
    getAllPosts(),
    getCategories(),
    getTags(),
    getTools(),
    getKeywords(),
  ]);

  const now = new Date().toISOString();
  const published = posts.filter(
    (p) =>
      p.status === "published" ||
      (p.status === "scheduled" && p.scheduledFor && p.scheduledFor <= now)
  );
  const drafts = posts.filter((p) => p.status === "draft");
  const scheduled = posts.filter(
    (p) => p.status === "scheduled" && (!p.scheduledFor || p.scheduledFor > now)
  );

  const issues = {
    missingMeta: posts.filter(
      (p) => !p.seo?.metaTitle || !p.seo?.metaDescription
    ).length,
    missingFaq: posts.filter((p) => !p.faqs || p.faqs.length === 0).length,
    missingFeaturedImage: posts.filter((p) => !p.featuredImage).length,
    missingFocusKeyword: posts.filter((p) => !p.strategy?.focusKeyword).length,
    reviewMissingTool: posts.filter(
      (p) => p.format === "tool-review" && !p.reviewToolId
    ).length,
    schemaDisabled: posts.filter(
      (p) =>
        p.schemaOverrides?.emit?.blogPosting === false ||
        p.schemaOverrides?.emit?.breadcrumb === false
    ).length,
  };

  return {
    posts: posts.length,
    published: published.length,
    drafts: drafts.length,
    scheduled: scheduled.length,
    categories: categories.length,
    tags: tags.length,
    tools: tools.length,
    keywords: keywords.length,
    keywordsByStatus: {
      idea: keywords.filter((k) => k.status === "idea").length,
      writing: keywords.filter((k) => k.status === "writing").length,
      published: keywords.filter((k) => k.status === "published").length,
      update: keywords.filter((k) => k.status === "update").length,
    },
    issues,
  };
}
