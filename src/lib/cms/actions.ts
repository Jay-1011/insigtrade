"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isLoggedIn } from "./auth";
import {
  deleteCategory,
  deleteKeyword,
  deletePost,
  deleteTool,
  getKeywordById,
  getKeywords,
  getPublishedPosts,
  saveCategory,
  saveKeyword,
  savePost,
  saveSchemaConfig,
  saveTool,
  slugifyStr,
} from "./store";
import {
  articleToPost,
  generateArticleForKeyword,
  isClaudeAvailable,
  suggestKeywords,
  type SuggestedKeyword,
} from "@/lib/ai/claude";
import type {
  Block,
  Category,
  Keyword,
  Post,
  SchemaConfig,
  SchemaOverrides,
  Tool,
} from "./types";

async function requireAuth() {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

function parseJsonField<T>(raw: FormDataEntryValue | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return fallback;
  }
}

// ──────────────────────────────────────────────────────────
// Posts
// ──────────────────────────────────────────────────────────

export async function savePostAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? crypto.randomUUID());
  const title = String(formData.get("title") ?? "").trim();
  const slug =
    String(formData.get("slug") ?? "").trim() || slugifyStr(title);
  const subtitle = String(formData.get("subtitle") ?? "").trim() || undefined;
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const status = String(formData.get("status") ?? "draft") as Post["status"];
  const format = String(formData.get("format") ?? "guide") as Post["format"];
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const tagSlugs = String(formData.get("tagSlugs") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const authorId = String(formData.get("authorId") ?? "team");
  const featuredImage = String(formData.get("featuredImage") ?? "") || undefined;
  const featuredImageAlt = String(formData.get("featuredImageAlt") ?? "") || undefined;
  const readTime = String(formData.get("readTime") ?? "") || undefined;
  const scheduledFor = String(formData.get("scheduledFor") ?? "") || undefined;
  const blocks = parseJsonField<Block[]>(formData.get("blocks"), []);
  const faqs = parseJsonField<{ q: string; a: string }[]>(formData.get("faqs"), []);
  const seo = parseJsonField<Post["seo"]>(formData.get("seo"), {});
  const strategy = parseJsonField<Post["strategy"]>(formData.get("strategy"), {});
  const reviewToolId = String(formData.get("reviewToolId") ?? "") || undefined;
  const schemaOverrides = parseJsonField<SchemaOverrides>(formData.get("schemaOverrides"), {});

  if (!title) throw new Error("Title required");

  const now = new Date().toISOString();
  const existingCreatedAt = String(formData.get("createdAt") ?? "");

  const post: Post = {
    id,
    slug,
    title,
    subtitle,
    excerpt,
    status,
    format,
    categorySlug,
    tagSlugs,
    authorId,
    featuredImage,
    featuredImageAlt,
    readTime,
    scheduledFor,
    blocks,
    faqs,
    seo,
    strategy,
    reviewToolId,
    schemaOverrides,
    publishedAt:
      status === "published"
        ? String(formData.get("publishedAt") ?? now) || now
        : undefined,
    createdAt: existingCreatedAt || now,
    updatedAt: now,
  };

  await savePost(post);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  revalidatePath("/sitemap.xml");
  redirect("/admin/posts");
}

export async function deletePostAction(formData: FormData) {
  await requireAuth();
  const slug = String(formData.get("slug"));
  await deletePost(slug);
  revalidatePath("/blog");
  revalidatePath("/");
  redirect("/admin/posts");
}

// ──────────────────────────────────────────────────────────
// Keywords
// ──────────────────────────────────────────────────────────

export async function saveKeywordAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? crypto.randomUUID());
  const k: Keyword = {
    id,
    keyword: String(formData.get("keyword") ?? "").trim(),
    volume: Number(formData.get("volume") || 0) || undefined,
    difficulty: Number(formData.get("difficulty") || 0) || undefined,
    intent: (String(formData.get("intent") ?? "") as Keyword["intent"]) || undefined,
    cluster: String(formData.get("cluster") ?? "") || undefined,
    funnelStage:
      (String(formData.get("funnelStage") ?? "") as Keyword["funnelStage"]) || undefined,
    priority:
      (String(formData.get("priority") ?? "") as Keyword["priority"]) || undefined,
    suggestedTitle: String(formData.get("suggestedTitle") ?? "") || undefined,
    competitorUrls: String(formData.get("competitorUrls") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    monetization:
      (String(formData.get("monetization") ?? "") as Keyword["monetization"]) ||
      undefined,
    status: (String(formData.get("status") ?? "idea") as Keyword["status"]) || "idea",
    linkedPostSlug: String(formData.get("linkedPostSlug") ?? "") || undefined,
  };
  if (!k.keyword) throw new Error("Keyword required");
  await saveKeyword(k);
  revalidatePath("/admin/keywords");
  redirect("/admin/keywords");
}

export async function deleteKeywordAction(formData: FormData) {
  await requireAuth();
  await deleteKeyword(String(formData.get("id")));
  revalidatePath("/admin/keywords");
  redirect("/admin/keywords");
}

// ──────────────────────────────────────────────────────────
// Tools
// ──────────────────────────────────────────────────────────

export async function saveToolAction(formData: FormData) {
  await requireAuth();
  const id = String(formData.get("id") ?? crypto.randomUUID());
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim() || slugifyStr(name);
  const tool: Tool = {
    id,
    slug,
    name,
    tagline: String(formData.get("tagline") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    logo: String(formData.get("logo") ?? "") || undefined,
    website: String(formData.get("website") ?? "").trim(),
    affiliateUrl: String(formData.get("affiliateUrl") ?? "") || undefined,
    pricing: String(formData.get("pricing") ?? "").trim(),
    rating: Number(formData.get("rating") || 0),
    features: String(formData.get("features") ?? "")
      .split("\n").map((s) => s.trim()).filter(Boolean),
    pros: String(formData.get("pros") ?? "")
      .split("\n").map((s) => s.trim()).filter(Boolean),
    cons: String(formData.get("cons") ?? "")
      .split("\n").map((s) => s.trim()).filter(Boolean),
    useCases: String(formData.get("useCases") ?? "")
      .split("\n").map((s) => s.trim()).filter(Boolean),
    verdict: String(formData.get("verdict") ?? "") || undefined,
    badge: String(formData.get("badge") ?? "") || undefined,
  };
  if (!tool.name) throw new Error("Name required");
  await saveTool(tool);
  revalidatePath("/reviews");
  revalidatePath(`/reviews/${tool.slug}`);
  redirect("/admin/tools");
}

export async function deleteToolAction(formData: FormData) {
  await requireAuth();
  await deleteTool(String(formData.get("id")));
  revalidatePath("/reviews");
  redirect("/admin/tools");
}

// ──────────────────────────────────────────────────────────
// Categories
// ──────────────────────────────────────────────────────────

export async function saveCategoryAction(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const slug =
    String(formData.get("slug") ?? "").trim() || slugifyStr(name);
  const cat: Category = {
    slug,
    name,
    description: String(formData.get("description") ?? "").trim(),
    seoTitle: String(formData.get("seoTitle") ?? "") || undefined,
    seoDescription: String(formData.get("seoDescription") ?? "") || undefined,
    pillarPostSlug: String(formData.get("pillarPostSlug") ?? "") || undefined,
    faqs: parseJsonField<{ q: string; a: string }[]>(formData.get("faqs"), []),
  };
  if (!cat.name) throw new Error("Name required");
  await saveCategory(cat);
  revalidatePath("/blog");
  revalidatePath(`/category/${cat.slug}`);
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAuth();
  await deleteCategory(String(formData.get("slug")));
  revalidatePath("/blog");
  redirect("/admin/categories");
}

// ──────────────────────────────────────────────────────────
// Schema config (global JSON-LD defaults)
// ──────────────────────────────────────────────────────────

export async function saveSchemaConfigAction(formData: FormData) {
  await requireAuth();
  const cfg: SchemaConfig = {
    organization: {
      name: String(formData.get("orgName") ?? "").trim(),
      legalName: String(formData.get("orgLegal") ?? "") || undefined,
      logo: String(formData.get("orgLogo") ?? "") || undefined,
      foundingDate: String(formData.get("orgFounded") ?? "") || undefined,
      sameAs: String(formData.get("orgSameAs") ?? "")
        .split("\n").map((s) => s.trim()).filter(Boolean),
      contactPoint: {
        email: String(formData.get("orgEmail") ?? "") || undefined,
        telephone: String(formData.get("orgPhone") ?? "") || undefined,
        contactType: String(formData.get("orgContactType") ?? "") || "customer support",
      },
    },
    website: {
      name: String(formData.get("siteName") ?? "").trim(),
      description: String(formData.get("siteDescription") ?? "").trim(),
      inLanguage: String(formData.get("siteLanguage") ?? "en-US"),
      enableSearchAction: formData.get("siteSearch") === "on",
    },
    defaultAuthor: {
      name: String(formData.get("authorName") ?? "").trim(),
      url: String(formData.get("authorUrl") ?? "") || undefined,
    },
  };
  await saveSchemaConfig(cfg);
  revalidatePath("/");
  revalidatePath("/blog");
  redirect("/admin/schemas");
}

// ──────────────────────────────────────────────────────────
// AI: Claude-powered keyword suggestions + blog generation
// ──────────────────────────────────────────────────────────

export interface SuggestKeywordsResult {
  ok: boolean;
  error?: string;
  keywords?: SuggestedKeyword[];
}

/** Suggest keywords using Claude. Used by the "Suggest with Claude" UI. */
export async function suggestKeywordsAction(
  formData: FormData
): Promise<SuggestKeywordsResult> {
  await requireAuth();
  if (!isClaudeAvailable()) {
    return {
      ok: false,
      error:
        "Claude API not configured. Either add ANTHROPIC_API_KEY to .env.local, or use Claude Code in your terminal — it's free under your Max plan.",
    };
  }
  const seed = String(formData.get("seed") ?? "").trim();
  if (!seed) return { ok: false, error: "Seed topic required" };

  try {
    const existing = (await getKeywords()).map((k) => k.keyword);
    const suggestions = await suggestKeywords({
      seedTopic: seed,
      cluster: String(formData.get("cluster") ?? "") || undefined,
      preferredIntent:
        (String(formData.get("intent") ?? "") as Keyword["intent"]) || undefined,
      count: Number(formData.get("count") || 10) || 10,
      existingKeywords: existing,
    });
    return { ok: true, keywords: suggestions };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ──────────────────────────────────────────────────────────
// Bulk import keywords (CSV / TSV from Semrush, Ahrefs, GSC etc.)
// ──────────────────────────────────────────────────────────

/**
 * Accepts a free-form CSV/TSV paste and creates `idea` keywords.
 * Auto-detects delimiter (\t , ;).
 *
 * Required column: keyword (case-insensitive header match).
 * Optional columns: volume, kd, difficulty, intent, cluster, cpc, position
 *
 * Semrush "Keyword Magic Tool" export works directly — paste with headers.
 */
export async function bulkImportKeywordsAction(formData: FormData) {
  await requireAuth();
  const raw = String(formData.get("csv") ?? "").trim();
  const defaultCluster = String(formData.get("defaultCluster") ?? "").trim() || undefined;
  if (!raw) return;

  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return;

  // Detect delimiter
  const firstLine = lines[0];
  const delim =
    firstLine.includes("\t") ? "\t" :
    firstLine.includes(";") ? ";" :
    ",";

  const splitRow = (line: string): string[] => {
    // Naive but handles quoted fields with commas
    const out: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === delim && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out.map((c) => c.replace(/^"|"$/g, ""));
  };

  const headers = splitRow(lines[0]).map((h) => h.toLowerCase().trim());
  const colIndex = (...names: string[]): number => {
    for (const n of names) {
      const i = headers.findIndex((h) => h === n || h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iKeyword = colIndex("keyword", "query", "phrase");
  if (iKeyword < 0) {
    throw new Error('CSV must have a "keyword" column (also accepts "query" or "phrase").');
  }
  const iVolume = colIndex("volume", "search volume", "avg. monthly searches", "impressions");
  const iKd = colIndex("kd", "keyword difficulty", "difficulty", "competition");
  const iIntent = colIndex("intent", "search intent");
  const iCluster = colIndex("cluster", "topic", "category", "group");

  const existing = new Set(
    (await getKeywords()).map((k) => k.keyword.toLowerCase())
  );

  let added = 0;
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i]);
    const keyword = (cols[iKeyword] ?? "").trim();
    if (!keyword) continue;
    if (existing.has(keyword.toLowerCase())) {
      skipped++;
      continue;
    }
    const volume = iVolume >= 0 ? Number(cols[iVolume]?.replace(/,/g, "")) || undefined : undefined;
    const kdRaw = iKd >= 0 ? cols[iKd] : "";
    const difficulty = kdRaw ? Number(kdRaw.replace(/[^\d.]/g, "")) || undefined : undefined;
    const intent =
      iIntent >= 0
        ? normalizeIntent(cols[iIntent])
        : undefined;

    const k: Keyword = {
      id: crypto.randomUUID(),
      keyword,
      volume,
      difficulty,
      intent,
      cluster: (iCluster >= 0 ? cols[iCluster] : undefined) || defaultCluster,
      priority:
        difficulty !== undefined
          ? difficulty <= 18
            ? "high"
            : difficulty <= 30
            ? "medium"
            : "low"
          : "medium",
      status: "idea",
    };
    await saveKeyword(k);
    existing.add(keyword.toLowerCase());
    added++;
  }

  revalidatePath("/admin/keywords");
  redirect(`/admin/keywords?imported=${added}&skipped=${skipped}`);
}

function normalizeIntent(s?: string): Keyword["intent"] | undefined {
  if (!s) return undefined;
  const v = s.toLowerCase().trim();
  if (v.startsWith("info") || v === "i") return "informational";
  if (v.startsWith("comm") || v === "c") return "commercial";
  if (v.startsWith("comp")) return "comparison";
  if (v.startsWith("trans") || v === "t") return "transactional";
  if (v.startsWith("nav") || v === "n") return "navigational";
  return undefined;
}

/** Persist Claude's suggestions as `idea` keywords in the planner. */
export async function persistSuggestedKeywordsAction(formData: FormData) {
  await requireAuth();
  const raw = String(formData.get("suggestions") ?? "[]");
  let parsed: SuggestedKeyword[] = [];
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  for (const s of parsed) {
    const k: Keyword = {
      id: crypto.randomUUID(),
      keyword: s.keyword,
      volume: s.estimatedVolume,
      difficulty: s.estimatedDifficulty,
      intent: s.intent,
      cluster: s.cluster,
      funnelStage: s.funnelStage,
      monetization: s.monetization,
      suggestedTitle: s.suggestedTitle,
      priority:
        s.estimatedDifficulty <= 18
          ? "high"
          : s.estimatedDifficulty <= 30
          ? "medium"
          : "low",
      status: "idea",
    };
    await saveKeyword(k);
  }
  revalidatePath("/admin/keywords");
  redirect("/admin/keywords");
}

/** Generate a full blog post from a keyword via Claude. Per-row "Generate Blog" button. */
export async function generateBlogForKeywordAction(formData: FormData) {
  await requireAuth();
  if (!isClaudeAvailable()) {
    throw new Error(
      "AI generation requires ANTHROPIC_API_KEY in .env.local. " +
        "Without it, generate posts manually via Claude Code (this terminal)."
    );
  }
  const keywordId = String(formData.get("keywordId") ?? "");
  const status = (String(formData.get("status") ?? "draft") as Post["status"]);
  const scheduledFor = String(formData.get("scheduledFor") ?? "") || undefined;

  const keyword = await getKeywordById(keywordId);
  if (!keyword) throw new Error("Keyword not found");

  // Best-effort internal links: 3 most-recent published posts in same cluster
  const allPosts = await getPublishedPosts();
  const internalLinks = allPosts
    .filter((p) => p.categorySlug === keyword.cluster)
    .slice(0, 3)
    .map((p) => ({ label: p.title, href: `/blog/${p.slug}` }));

  const article = await generateArticleForKeyword({
    keyword: {
      keyword: keyword.keyword,
      intent: keyword.intent,
      cluster: keyword.cluster,
      funnelStage: keyword.funnelStage,
      monetization: keyword.monetization,
      suggestedTitle: keyword.suggestedTitle,
    },
    internalLinks,
  });

  const slug = slugifyStr(article.title);
  const post = articleToPost({
    article,
    slug,
    authorId: "team",
    categorySlug: keyword.cluster ?? "ai-for-traders",
    tagSlugs: [],
    status,
    scheduledFor,
    monetization: keyword.monetization,
    intent: keyword.intent,
    funnelStage: keyword.funnelStage,
  });

  await savePost(post);

  // Mark keyword as writing + link to the post
  keyword.status = "writing";
  keyword.linkedPostSlug = slug;
  await saveKeyword(keyword);

  revalidatePath("/admin/posts");
  revalidatePath("/admin/keywords");
  revalidatePath("/blog");
  redirect(`/admin/posts/${slug}`);
}
