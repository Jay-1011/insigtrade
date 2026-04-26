#!/usr/bin/env node
// node scripts/generate-articles.mjs [--count 5] [--cluster ai-for-traders] [--status draft|scheduled]
//
// Reads keywords with status="idea" and generates draft articles for them.
// Optionally schedules them spaced N days apart.
//
// If OPENAI_API_KEY is set, uses GPT to write the body. Otherwise emits a
// well-structured skeleton you can edit in /admin/posts.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ROOT = path.join(process.cwd(), "content");
const args = parseArgs(process.argv.slice(2));

function parseArgs(arr) {
  const out = { count: 5, status: "draft", scheduleDaysApart: 0, cluster: null };
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    if (a === "--count") out.count = Number(arr[++i]);
    else if (a === "--cluster") out.cluster = arr[++i];
    else if (a === "--status") out.status = arr[++i];
    else if (a === "--space") out.scheduleDaysApart = Number(arr[++i]);
  }
  return out;
}

async function readJsonDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  const files = await fs.readdir(dir);
  const out = [];
  for (const f of files) {
    if (!f.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    try { out.push(JSON.parse(raw)); } catch {}
  }
  return out;
}

const slugify = (s) =>
  s.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function deriveTitleFromKeyword(kw) {
  const k = kw.keyword;
  if (kw.suggestedTitle) return kw.suggestedTitle;
  if (k.startsWith("how to")) return capitalize(k);
  if (k.includes(" vs ")) return `${capitalize(k)}: Which Wins in 2026?`;
  if (k.startsWith("best ")) return `${capitalize(k)} (Tested in 2026)`;
  return `The Complete Guide to ${capitalize(k)}`;
}

function capitalize(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickFormat(kw) {
  const k = kw.keyword.toLowerCase();
  if (k.includes(" vs ")) return "comparison";
  if (k.startsWith("best ")) return "listicle";
  if (k.startsWith("how to")) return "tutorial";
  if (k.includes("review")) return "tool-review";
  if (kw.intent === "commercial") return "listicle";
  return "guide";
}

// Skeleton generator (no LLM required)
function buildSkeleton(kw, title) {
  const format = pickFormat(kw);
  const blocks = [];

  blocks.push({ type: "tldr", text: `A 1-line answer for: ${kw.keyword}. Replace with the real takeaway after testing.` });
  blocks.push({ type: "paragraph", text: `Intro paragraph for "${kw.keyword}" — hook the reader with the specific pain or curiosity behind this search.` });

  blocks.push({ type: "key-takeaways", items: [
    "Key insight #1 — replace with what changed your mind",
    "Key insight #2 — the contrarian point most posts miss",
    "Key insight #3 — what to do today",
  ]});

  if (format === "tutorial") {
    blocks.push({ type: "heading", level: 2, text: "Step-by-step setup" });
    blocks.push({ type: "steps", title: "Build it in 30 minutes", steps: [
      { title: "Step 1 — Setup", body: "Describe the first concrete action." },
      { title: "Step 2 — Connect", body: "Wire the components together." },
      { title: "Step 3 — Test", body: "Validate the workflow with a real example." },
      { title: "Step 4 — Schedule", body: "Make it run automatically." },
    ]});
    blocks.push({ type: "callout", variant: "tip", title: "Pro tip", text: "Add a real-world tip from your testing." });
  }

  if (format === "listicle") {
    blocks.push({ type: "heading", level: 2, text: "The shortlist (after testing)" });
    blocks.push({ type: "paragraph", text: "Brief context: how we tested, time invested, criteria." });
    for (let i = 1; i <= 5; i++) {
      blocks.push({ type: "heading", level: 2, text: `${i}. Tool / Pick #${i}` });
      blocks.push({ type: "paragraph", text: "Why it earned the spot. One specific result you got with it." });
      blocks.push({ type: "pros-cons", pros: ["Pro 1","Pro 2"], cons: ["Con 1"] });
    }
  }

  if (format === "comparison") {
    blocks.push({ type: "heading", level: 2, text: "Side-by-side at a glance" });
    blocks.push({ type: "table", headers: ["Feature","Option A","Option B"], rows: [
      ["Pricing","$X","$Y"],
      ["Best for","...","..."],
      ["Free tier","Yes","No"],
    ]});
    blocks.push({ type: "heading", level: 2, text: "Where Option A wins" });
    blocks.push({ type: "paragraph", text: "..." });
    blocks.push({ type: "heading", level: 2, text: "Where Option B wins" });
    blocks.push({ type: "paragraph", text: "..." });
    blocks.push({ type: "heading", level: 2, text: "Verdict" });
    blocks.push({ type: "callout", variant: "success", title: "Our pick", text: "..." });
  }

  if (format === "guide") {
    blocks.push({ type: "heading", level: 2, text: "Background" });
    blocks.push({ type: "paragraph", text: "..." });
    blocks.push({ type: "heading", level: 2, text: "How it works" });
    blocks.push({ type: "paragraph", text: "..." });
    blocks.push({ type: "heading", level: 2, text: "Common mistakes" });
    blocks.push({ type: "checklist", items: ["Mistake 1","Mistake 2","Mistake 3"] });
  }

  blocks.push({ type: "newsletter" });

  return { blocks, format };
}

// Optional Claude-powered article generation.
// If ANTHROPIC_API_KEY is set, uses the full Claude pipeline for publish-ready posts.
// Otherwise falls back to the local skeleton.
async function maybeGenerateWithClaude(kw) {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic();
    const model = process.env.CLAUDE_MODEL || "claude-opus-4-7";

    const SYSTEM = `You are the editorial AI for Insigtrade — a content brand for traders, finance enthusiasts and modern operators using AI tools and automation. Voice: pragmatic, plain-spoken, honest. Numbers > adjectives. No hype words. Cite real tools by name. Define jargon on first use. Always include FAQs. Return ONLY valid JSON matching the schema given by the user.`;

    const userMessage = `Write a complete, publish-ready article for the keyword "${kw.keyword}".\n\nWorking title: ${kw.suggestedTitle ?? ""}\nIntent: ${kw.intent ?? "informational"}\nCluster: ${kw.cluster ?? "ai-for-traders"}\nFunnel: ${kw.funnelStage ?? "TOFU"}\nMonetization: ${kw.monetization ?? "newsletter"}\n\nReturn JSON with this exact shape:\n{\n  "title": string,\n  "subtitle"?: string,\n  "excerpt": string (140-160 chars),\n  "format": "guide"|"tutorial"|"listicle"|"comparison"|"tool-review",\n  "readTime": string (e.g. "8 min read"),\n  "blocks": [ /* array of content blocks: tldr, paragraph, heading (level 2/3/4), key-takeaways{items[]}, checklist{items[]}, callout{variant,title?,text}, steps{steps:[{title,body}]}, pros-cons{pros[],cons[]}, table{headers[],rows[][]}, cta{title,ctaLabel,ctaHref}, newsletter */ ],\n  "faqs": [ {"q": string, "a": string}, ... 3-5 entries ],\n  "seo": { "metaTitle": string, "metaDescription": string },\n  "strategy": { "focusKeyword": string, "secondaryKeywords": string[] }\n}\n\nRules:\n- Open with tldr block\n- Include key-takeaways block (3-5 bullets)\n- 4-6 H2 headings\n- 1200-1800 words across paragraph blocks\n- End body with newsletter block\n- 3-5 FAQs\n- No commentary outside JSON.`;

    const stream = client.messages.stream({
      model,
      max_tokens: 32000,
      thinking: { type: "adaptive" },
      output_config: { effort: "high", format: { type: "json_object" } },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    });

    const final = await stream.finalMessage();
    const textBlock = final.content.find((b) => b.type === "text");
    if (!textBlock?.text) throw new Error("no text content");
    return JSON.parse(textBlock.text);
  } catch (e) {
    console.warn("[generator] Claude generation failed, using skeleton:", e.message);
    return null;
  }
}

async function main() {
  const [keywords, posts, categories] = await Promise.all([
    readJsonDir(path.join(ROOT, "keywords")),
    readJsonDir(path.join(ROOT, "posts")),
    readJsonDir(path.join(ROOT, "categories")),
  ]);

  const existingSlugs = new Set(posts.map((p) => p.slug));
  const ideas = keywords
    .filter((k) => k.status === "idea")
    .filter((k) => !args.cluster || k.cluster === args.cluster);

  if (ideas.length === 0) {
    console.log("No keywords with status='idea' found. Add some in /admin/keywords first.");
    return;
  }

  const batch = ideas.slice(0, args.count);
  let scheduledOffset = 0;
  let created = 0;

  for (const kw of batch) {
    const title = deriveTitleFromKeyword(kw);
    const slug = slugify(title);
    if (existingSlugs.has(slug)) {
      console.log(`↷ skip "${title}" — slug already exists`);
      continue;
    }
    // Try Claude first; fall back to skeleton.
    const ai = await maybeGenerateWithClaude(kw);

    const cat = categories.find((c) => c.slug === kw.cluster) ?? categories[0];
    const now = new Date();
    let scheduledFor;
    let status = args.status;
    if (status === "scheduled" && args.scheduleDaysApart > 0) {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + scheduledOffset);
      scheduledFor = dt.toISOString();
      scheduledOffset += args.scheduleDaysApart;
    }

    const { blocks: skeletonBlocks, format: skeletonFormat } = buildSkeleton(kw, title);

    const post = {
      id: randomUUID(),
      slug,
      title: ai?.title ?? title,
      excerpt: ai?.excerpt ?? `${title}. Generated draft — refine in /admin.`,
      format: ai?.format ?? skeletonFormat,
      status,
      ...(scheduledFor && { scheduledFor }),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      authorId: "team",
      categorySlug: cat?.slug ?? "ai-for-traders",
      tagSlugs: [],
      readTime: ai?.readTime ?? "8 min read",
      blocks: ai?.blocks ?? skeletonBlocks,
      faqs: ai?.faqs ?? [
        { q: `What is ${kw.keyword}?`, a: "Replace with a real, concise answer." },
        { q: "How do I get started?", a: "Replace with a 2-sentence first step." },
      ],
      seo: ai?.seo ?? {
        metaTitle: title.length <= 70 ? title : title.slice(0, 67) + "...",
        metaDescription: `Learn ${kw.keyword} — practical guide with steps, tools and FAQs.`,
      },
      strategy: {
        focusKeyword: ai?.strategy?.focusKeyword ?? kw.keyword,
        secondaryKeywords: ai?.strategy?.secondaryKeywords ?? [],
        intent: kw.intent,
        funnelStage: kw.funnelStage,
        monetization: kw.monetization,
        affiliateArticle: kw.monetization === "affiliate",
        productCta: kw.monetization === "product",
      },
    };

    await fs.writeFile(
      path.join(ROOT, "posts", `${slug}.json`),
      JSON.stringify(post, null, 2),
      "utf8"
    );

    // Mark keyword as writing + link
    kw.status = "writing";
    kw.linkedPostSlug = slug;
    await fs.writeFile(
      path.join(ROOT, "keywords", `${kw.id}.json`),
      JSON.stringify(kw, null, 2),
      "utf8"
    );

    created++;
    console.log(`✓ created draft: ${slug}${scheduledFor ? ` (scheduled ${scheduledFor.slice(0, 10)})` : ""}`);
  }

  console.log(`\n${created} draft(s) generated. Open /admin/posts to refine.`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log("ℹ Set ANTHROPIC_API_KEY to generate publish-ready posts via Claude (Opus 4.7).");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
