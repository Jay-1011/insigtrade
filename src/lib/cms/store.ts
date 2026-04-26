// ──────────────────────────────────────────────────────────
// File-based CMS store. Reads/writes JSON in /content.
// Server-only. Do not import from client components.
// ──────────────────────────────────────────────────────────

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import slugify from "slugify";
import type {
  Author,
  Category,
  Keyword,
  Post,
  SchemaConfig,
  Tag,
  Testimonial,
  Tool,
} from "./types";

const ROOT = path.join(process.cwd(), "content");

const dirs = {
  posts: path.join(ROOT, "posts"),
  categories: path.join(ROOT, "categories"),
  tags: path.join(ROOT, "tags"),
  authors: path.join(ROOT, "authors"),
  tools: path.join(ROOT, "tools"),
  keywords: path.join(ROOT, "keywords"),
  testimonials: path.join(ROOT, "testimonials"),
  config: path.join(ROOT, "config"),
} as const;

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function readJsonDir<T>(dir: string): Promise<T[]> {
  await ensureDir(dir);
  const files = await fs.readdir(dir);
  const out: T[] = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    try {
      out.push(JSON.parse(raw) as T);
    } catch (e) {
      console.error(`[cms] failed to parse ${f}:`, e);
    }
  }
  return out;
}

async function writeJson(dir: string, key: string, data: unknown) {
  await ensureDir(dir);
  const p = path.join(dir, `${key}.json`);
  await fs.writeFile(p, JSON.stringify(data, null, 2), "utf8");
}

async function deleteJson(dir: string, key: string) {
  const p = path.join(dir, `${key}.json`);
  try {
    await fs.unlink(p);
  } catch {}
}

export const slugifyStr = (s: string) =>
  slugify(s, { lower: true, strict: true, trim: true });

// ──────────────────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<Post[]> {
  const posts = await readJsonDir<Post>(dirs.posts);
  return posts.sort((a, b) => {
    const da = a.publishedAt ?? a.updatedAt;
    const db = b.publishedAt ?? b.updatedAt;
    return db.localeCompare(da);
  });
}

export async function getPublishedPosts(): Promise<Post[]> {
  const all = await getAllPosts();
  const now = new Date().toISOString();
  return all.filter(
    (p) =>
      p.status === "published" ||
      (p.status === "scheduled" && p.scheduledFor && p.scheduledFor <= now)
  );
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const all = await getAllPosts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function savePost(post: Post): Promise<Post> {
  post.updatedAt = new Date().toISOString();
  if (!post.slug) post.slug = slugifyStr(post.title);
  await writeJson(dirs.posts, post.slug, post);
  return post;
}

export async function deletePost(slug: string) {
  await deleteJson(dirs.posts, slug);
}

// ──────────────────────────────────────────────────────────
// Categories / Tags / Authors
// ──────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  return readJsonDir<Category>(dirs.categories);
}
export async function getCategoryBySlug(slug: string) {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}
export async function saveCategory(c: Category) {
  await writeJson(dirs.categories, c.slug, c);
  return c;
}
export async function deleteCategory(slug: string) {
  await deleteJson(dirs.categories, slug);
}

export async function getTags(): Promise<Tag[]> {
  return readJsonDir<Tag>(dirs.tags);
}
export async function getTagBySlug(slug: string) {
  const tags = await getTags();
  return tags.find((t) => t.slug === slug) ?? null;
}
export async function saveTag(t: Tag) {
  await writeJson(dirs.tags, t.slug, t);
  return t;
}
export async function deleteTag(slug: string) {
  await deleteJson(dirs.tags, slug);
}

export async function getAuthors(): Promise<Author[]> {
  return readJsonDir<Author>(dirs.authors);
}
export async function getAuthorById(id: string) {
  const auth = await getAuthors();
  return auth.find((a) => a.id === id) ?? null;
}
export async function saveAuthor(a: Author) {
  await writeJson(dirs.authors, a.id, a);
  return a;
}

// ──────────────────────────────────────────────────────────
// Tools
// ──────────────────────────────────────────────────────────

export async function getTools(): Promise<Tool[]> {
  return readJsonDir<Tool>(dirs.tools);
}
export async function getToolById(id: string) {
  const tools = await getTools();
  return tools.find((t) => t.id === id) ?? null;
}
export async function getToolBySlug(slug: string) {
  const tools = await getTools();
  return tools.find((t) => t.slug === slug) ?? null;
}
export async function saveTool(t: Tool) {
  if (!t.slug) t.slug = slugifyStr(t.name);
  await writeJson(dirs.tools, t.id, t);
  return t;
}
export async function deleteTool(id: string) {
  await deleteJson(dirs.tools, id);
}

// ──────────────────────────────────────────────────────────
// Keywords
// ──────────────────────────────────────────────────────────

export async function getKeywords(): Promise<Keyword[]> {
  return readJsonDir<Keyword>(dirs.keywords);
}
export async function getKeywordById(id: string) {
  const all = await getKeywords();
  return all.find((k) => k.id === id) ?? null;
}
export async function saveKeyword(k: Keyword) {
  await writeJson(dirs.keywords, k.id, k);
  return k;
}
export async function deleteKeyword(id: string) {
  await deleteJson(dirs.keywords, id);
}

// ──────────────────────────────────────────────────────────
// Testimonials
// ──────────────────────────────────────────────────────────

export async function getTestimonials(): Promise<Testimonial[]> {
  return readJsonDir<Testimonial>(dirs.testimonials);
}

// ──────────────────────────────────────────────────────────
// Schema config (global JSON-LD defaults)
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
  try {
    await ensureDir(dirs.config);
    const p = path.join(dirs.config, "schema.json");
    const raw = await fs.readFile(p, "utf8");
    const parsed = JSON.parse(raw) as Partial<SchemaConfig>;
    // Deep-merge with defaults so missing fields get sane values
    return {
      organization: { ...DEFAULT_SCHEMA_CONFIG.organization, ...parsed.organization } as SchemaConfig["organization"],
      website: { ...DEFAULT_SCHEMA_CONFIG.website, ...parsed.website } as SchemaConfig["website"],
      defaultAuthor: {
        ...DEFAULT_SCHEMA_CONFIG.defaultAuthor!,
        ...parsed.defaultAuthor,
      } as SchemaConfig["defaultAuthor"],
    };
  } catch {
    return DEFAULT_SCHEMA_CONFIG;
  }
}

export async function saveSchemaConfig(cfg: SchemaConfig) {
  await writeJson(dirs.config, "schema", cfg);
  return cfg;
}

// ──────────────────────────────────────────────────────────
// Stats (for admin dashboard)
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

  // SEO health audit
  const issues = {
    missingMeta: posts.filter(
      (p) => !p.seo?.metaTitle || !p.seo?.metaDescription
    ).length,
    missingFaq: posts.filter((p) => !p.faqs || p.faqs.length === 0).length,
    missingFeaturedImage: posts.filter((p) => !p.featuredImage).length,
    missingFocusKeyword: posts.filter((p) => !p.strategy?.focusKeyword).length,
    // Schema-specific:
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
