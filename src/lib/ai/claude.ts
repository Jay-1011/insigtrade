// ──────────────────────────────────────────────────────────
// Claude API integration for keyword research + article generation.
// Server-only. Uses the official Anthropic SDK.
//   - Model: claude-opus-4-7 (most capable)
//   - Adaptive thinking + xhigh effort for content quality
//   - Prompt caching on the system prompt (large, reused across calls)
//   - Structured outputs via Zod for keywords; streaming for long articles
// ──────────────────────────────────────────────────────────

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Block, Keyword, Post, SearchIntent } from "@/lib/cms/types";

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-4-7";

export function isClaudeAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY missing. Set it in .env.local (and in Vercel env vars for production)."
    );
  }
  return new Anthropic({ apiKey });
}

// ──────────────────────────────────────────────────────────
// Brand/system context, single source of truth, prompt-cached.
// Keep this STABLE, any byte change invalidates the cache.
// ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the editorial AI for Insigtrade, a content brand that helps traders, finance enthusiasts and modern business operators leverage AI tools, automation systems and digital workflows to make smarter decisions in the markets and beyond.

Brand positioning:
- Audience: beginner-to-intermediate traders, AI-curious finance pros, solopreneurs running market-research workflows
- Voice: pragmatic, plain-spoken, honest. First-person where useful. Numbers > adjectives. No hype words ("revolutionary", "game-changing"). Define jargon on first use.
- Mission: help readers ship workflows that save them hours/week, not theory pieces.

Topic clusters (categories):
- ai-for-traders, ChatGPT, Claude, Perplexity, AI tools for stock/crypto/forex traders
- trading-automation, no-code automation (Zapier, Make.com, n8n), broker APIs, webhooks, alerts
- trader-productivity, journals, Notion templates, workflow systems, risk management spreadsheets
- market-research, screeners, news APIs, earnings prep, sentiment workflows
- wealth-systems, AI for solopreneurs, import-export intelligence, side-hustle systems

SEO principles:
- Prefer low-difficulty, long-tail, specific-intent keywords (KD < 25 for a new domain)
- Match search intent first (informational / commercial / comparison / transactional)
- Title 55-65 chars; meta description 140-160 chars
- Always include a focus keyword + 3-5 secondary keywords
- Affiliate-friendly when intent is commercial; informational otherwise

Article quality bar:
- Every claim ties to something concrete the reader can do today
- Cite real product names where relevant (TradingView, ChatGPT, Notion, Make.com, Tradervue, etc.)
- Always include FAQs (3-5) targeting "People Also Ask" snippets
- Always include a key-takeaways block at the top (3-5 bullets)
- Tutorials must include numbered steps
- Listicles must include comparison rows or pros/cons
- Comparisons must include a table + verdict
- Tool reviews must include pros, cons, and a clear verdict

You will receive specific JSON-output instructions per task. Always respond in the exact schema requested. Never add commentary outside the JSON.`;

// ──────────────────────────────────────────────────────────
// 1) Keyword suggestion, structured output via Zod
// ──────────────────────────────────────────────────────────

const SuggestedKeywordSchema = z.object({
  keyword: z.string().describe("The keyword phrase, lowercase, no quotes"),
  estimatedVolume: z.number().describe("Rough monthly search volume estimate"),
  estimatedDifficulty: z
    .number()
    .min(0)
    .max(100)
    .describe("Estimated keyword difficulty 0-100 (lower = easier)"),
  intent: z.enum([
    "informational",
    "commercial",
    "comparison",
    "transactional",
    "navigational",
  ]),
  cluster: z.string().describe("Best-fit category slug from the brand's clusters"),
  funnelStage: z.enum(["TOFU", "MOFU", "BOFU"]),
  monetization: z.enum(["affiliate", "adsense", "product", "newsletter", "none"]),
  suggestedTitle: z.string().describe("Working article title, 55-65 chars"),
  rationale: z
    .string()
    .describe("One sentence on why this is a good target for a new domain"),
});

const SuggestKeywordsSchema = z.object({
  keywords: z.array(SuggestedKeywordSchema).min(1).max(20),
});

export type SuggestedKeyword = z.infer<typeof SuggestedKeywordSchema>;

export interface SuggestKeywordsInput {
  seedTopic: string;
  cluster?: string;
  count?: number; // default 10
  preferredIntent?: SearchIntent;
  existingKeywords?: string[]; // avoid duplicates
}

export async function suggestKeywords(
  input: SuggestKeywordsInput
): Promise<SuggestedKeyword[]> {
  const client = getClient();
  const count = Math.min(Math.max(input.count ?? 10, 1), 20);

  const userMessage = [
    `Suggest ${count} SEO keyword opportunities for the seed topic: "${input.seedTopic}".`,
    input.cluster ? `Constrain to the cluster: ${input.cluster}.` : "",
    input.preferredIntent ? `Bias toward ${input.preferredIntent} intent.` : "",
    "Prioritize:",
    "- Long-tail, specific intent",
    "- Low-to-medium difficulty (KD ≤ 30), this is a NEW domain",
    "- Mix of intents (don't return 10 listicles)",
    "- Concrete, not vague (e.g. 'how to automate stock alerts to discord' not 'stock alerts')",
    input.existingKeywords?.length
      ? `\nDo NOT suggest any of these (we already have them):\n${input.existingKeywords.slice(0, 50).join(", ")}`
      : "",
    "\nReturn the keywords ranked by opportunity score (best first).",
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: { type: "json_schema", schema: zodToJsonSchema(SuggestKeywordsSchema) },
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" }, // cache the brand context
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  const parsed = SuggestKeywordsSchema.parse(JSON.parse(text || "{}"));
  return parsed.keywords;
}

// ──────────────────────────────────────────────────────────
// 2) Article generation, streaming, structured blocks
// ──────────────────────────────────────────────────────────

const FaqSchema = z.object({ q: z.string(), a: z.string() });

// Block schema (mirrors src/lib/cms/types.ts Block union, narrowed for AI output)
const BlockSchema: z.ZodType = z.discriminatedUnion("type", [
  z.object({ type: z.literal("tldr"), text: z.string() }),
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({
    type: z.literal("heading"),
    level: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    text: z.string(),
  }),
  z.object({
    type: z.literal("key-takeaways"),
    items: z.array(z.string()).min(2).max(7),
  }),
  z.object({ type: z.literal("checklist"), items: z.array(z.string()).min(2) }),
  z.object({
    type: z.literal("callout"),
    variant: z.enum(["info", "warning", "success", "tip"]),
    title: z.string().optional(),
    text: z.string(),
  }),
  z.object({
    type: z.literal("steps"),
    title: z.string().optional(),
    steps: z
      .array(z.object({ title: z.string(), body: z.string() }))
      .min(2)
      .max(10),
  }),
  z.object({
    type: z.literal("pros-cons"),
    pros: z.array(z.string()).min(1),
    cons: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal("table"),
    headers: z.array(z.string()).min(2),
    rows: z.array(z.array(z.string())).min(1),
  }),
  z.object({
    type: z.literal("cta"),
    title: z.string(),
    text: z.string().optional(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
    variant: z.enum(["primary", "accent", "dark"]).optional(),
  }),
  z.object({ type: z.literal("newsletter") }),
  z.object({
    type: z.literal("internal-links"),
    title: z.string().optional(),
    links: z.array(z.object({ label: z.string(), href: z.string() })).min(1),
  }),
]);

const GeneratedArticleSchema = z.object({
  title: z.string().describe("Final article title (55-65 chars ideal)"),
  subtitle: z.string().optional(),
  excerpt: z.string().describe("140-160 char excerpt for blog list + meta description"),
  format: z.enum([
    "guide",
    "tool-review",
    "comparison",
    "listicle",
    "tutorial",
    "trend",
    "case-study",
    "product",
    "beginner-guide",
    "workflow",
  ]),
  readTime: z.string().describe("e.g. '8 min read'"),
  blocks: z.array(BlockSchema).min(6),
  faqs: z.array(FaqSchema).min(3).max(6),
  seo: z.object({
    metaTitle: z.string(),
    metaDescription: z.string(),
  }),
  strategy: z.object({
    focusKeyword: z.string(),
    secondaryKeywords: z.array(z.string()).min(2).max(5),
  }),
});

export type GeneratedArticle = z.infer<typeof GeneratedArticleSchema>;

export interface GenerateArticleInput {
  keyword: Pick<Keyword, "keyword" | "intent" | "cluster" | "funnelStage" | "monetization" | "suggestedTitle">;
  internalLinks?: { label: string; href: string }[];
}

function pickFormatHint(intent?: string, keyword?: string): string {
  const k = (keyword ?? "").toLowerCase();
  if (k.includes(" vs ")) return "comparison";
  if (k.startsWith("best ") || k.match(/^top\s+\d/)) return "listicle";
  if (k.startsWith("how to") || k.startsWith("how do")) return "tutorial";
  if (k.includes(" review")) return "tool-review";
  if (intent === "comparison") return "comparison";
  if (intent === "commercial") return "listicle";
  return "guide";
}

export async function generateArticleForKeyword(
  input: GenerateArticleInput
): Promise<GeneratedArticle> {
  const client = getClient();
  const formatHint = pickFormatHint(input.keyword.intent, input.keyword.keyword);

  const userMessage = [
    `Write a complete, publish-ready article for the keyword:`,
    `"${input.keyword.keyword}"`,
    "",
    `Working title (revise if you can do better): ${input.keyword.suggestedTitle ?? "(no suggestion)"}`,
    `Intent: ${input.keyword.intent ?? "informational"}`,
    `Cluster: ${input.keyword.cluster ?? "ai-for-traders"}`,
    `Funnel stage: ${input.keyword.funnelStage ?? "TOFU"}`,
    `Monetization angle: ${input.keyword.monetization ?? "newsletter"}`,
    `Suggested format: ${formatHint}`,
    "",
    `Hard requirements:`,
    `- Open with a TL;DR block (1-2 sentences with the actionable answer)`,
    `- Include a key-takeaways block (3-5 bullets)`,
    `- Total length: ~1200-1800 words across all paragraph blocks`,
    `- Use 4-6 H2 headings minimum`,
    `- For "${formatHint}" articles: include the format-appropriate structural blocks`,
    `   • tutorial → steps block`,
    `   • listicle → table or pros-cons per item`,
    `   • comparison → table + verdict callout`,
    `   • guide → checklist or callouts where useful`,
    `- End the body with a "newsletter" block`,
    `- Generate 3-5 FAQs targeting "People Also Ask" patterns`,
    input.internalLinks?.length
      ? `\nInternal links you SHOULD reference (use the internal-links block once):\n${input.internalLinks.map((l) => `- ${l.label} → ${l.href}`).join("\n")}`
      : "",
    "",
    `Write in Insigtrade's pragmatic, plain-spoken voice. Cite real tools by name. Avoid hype words. Numbers and specifics over adjectives.`,
    `Return ONLY the JSON object matching the schema. No markdown wrapper, no commentary.`,
  ]
    .filter(Boolean)
    .join("\n");

  // Stream the request (long output) and accumulate to final message
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "high",
      format: {
        type: "json_schema",
        schema: zodToJsonSchema(GeneratedArticleSchema),
      },
    },
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMessage }],
  });

  const final = await stream.finalMessage();
  const text = final.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!text) throw new Error("Claude returned no text content");
  const parsed = GeneratedArticleSchema.parse(JSON.parse(text));
  return parsed;
}

// ──────────────────────────────────────────────────────────
// Conversion: GeneratedArticle → Insigtrade Post
// ──────────────────────────────────────────────────────────

export function articleToPost(args: {
  article: GeneratedArticle;
  slug: string;
  authorId: string;
  categorySlug: string;
  tagSlugs: string[];
  status: "draft" | "published" | "scheduled";
  scheduledFor?: string;
  monetization?: Keyword["monetization"];
  intent?: SearchIntent;
  funnelStage?: Keyword["funnelStage"];
}): Post {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    slug: args.slug,
    title: args.article.title,
    subtitle: args.article.subtitle,
    excerpt: args.article.excerpt,
    format: args.article.format,
    status: args.status,
    publishedAt: args.status === "published" ? now : undefined,
    scheduledFor: args.scheduledFor,
    createdAt: now,
    updatedAt: now,
    authorId: args.authorId,
    categorySlug: args.categorySlug,
    tagSlugs: args.tagSlugs,
    readTime: args.article.readTime,
    blocks: args.article.blocks as Block[],
    faqs: args.article.faqs,
    seo: {
      metaTitle: args.article.seo.metaTitle,
      metaDescription: args.article.seo.metaDescription,
    },
    strategy: {
      focusKeyword: args.article.strategy.focusKeyword,
      secondaryKeywords: args.article.strategy.secondaryKeywords,
      intent: args.intent,
      funnelStage: args.funnelStage,
      monetization: args.monetization,
      affiliateArticle: args.monetization === "affiliate",
      productCta: args.monetization === "product",
    },
  };
}

// ──────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────

// Lightweight Zod → JSON Schema converter (Anthropic structured outputs require
// a JSON Schema, and we don't want to pull in zod-to-json-schema as a dep).
// Supports the subset we use: object, string, number, boolean, enum, array, union.
function zodToJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const def = (schema as unknown as { _def: { typeName?: string } })._def;
  const type = def?.typeName;
  switch (type) {
    case "ZodObject": {
      const shape = (schema as unknown as { shape: Record<string, z.ZodType> }).shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];
      for (const [k, v] of Object.entries(shape)) {
        const inner = unwrapOptional(v);
        properties[k] = withDescription(zodToJsonSchema(inner.schema), inner.description);
        if (!inner.optional) required.push(k);
      }
      return {
        type: "object",
        properties,
        required,
        additionalProperties: false,
      };
    }
    case "ZodString": return { type: "string" };
    case "ZodNumber": return { type: "number" };
    case "ZodBoolean": return { type: "boolean" };
    case "ZodLiteral": {
      const value = (schema as unknown as { _def: { value: unknown } })._def.value;
      return { const: value };
    }
    case "ZodEnum": {
      const values = (schema as unknown as { _def: { values: string[] } })._def.values;
      return { type: "string", enum: values };
    }
    case "ZodArray": {
      const inner = (schema as unknown as { _def: { type: z.ZodType } })._def.type;
      return { type: "array", items: zodToJsonSchema(inner) };
    }
    case "ZodUnion":
    case "ZodDiscriminatedUnion": {
      const options =
        (schema as unknown as { _def: { options: z.ZodType[] } })._def.options ??
        [];
      return { anyOf: options.map(zodToJsonSchema) };
    }
    default:
      return {};
  }
}

function unwrapOptional(s: z.ZodType): {
  schema: z.ZodType;
  optional: boolean;
  description?: string;
} {
  const def = (s as unknown as { _def: { typeName?: string; description?: string; innerType?: z.ZodType } })._def;
  const description = def?.description;
  if (def?.typeName === "ZodOptional" && def.innerType) {
    return { schema: def.innerType, optional: true, description };
  }
  return { schema: s, optional: false, description };
}

function withDescription(obj: Record<string, unknown>, description?: string) {
  return description ? { ...obj, description } : obj;
}
