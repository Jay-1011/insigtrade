"use client";

import { useState } from "react";
import type {
  Block,
  Category,
  Post,
  SchemaOverrides,
  Tag,
  Tool,
} from "@/lib/cms/types";

interface Props {
  post?: Post;
  categories: Category[];
  tags: Tag[];
  tools: Tool[];
  onSubmit: (formData: FormData) => void | Promise<void>;
}

const blockTypeOptions: Block["type"][] = [
  "paragraph",
  "heading",
  "image",
  "quote",
  "callout",
  "checklist",
  "key-takeaways",
  "tldr",
  "cta",
  "tool-card",
  "table",
  "comparison",
  "pros-cons",
  "faq",
  "code",
  "video",
  "internal-links",
  "newsletter",
  "testimonial",
  "steps",
  "how-to",
];

function defaultBlock(type: Block["type"]): Block {
  switch (type) {
    case "paragraph": return { type, text: "" };
    case "heading": return { type, level: 2, text: "" };
    case "image": return { type, src: "", alt: "" };
    case "quote": return { type, text: "" };
    case "callout": return { type, variant: "info", text: "" };
    case "checklist": return { type, items: [""] };
    case "key-takeaways": return { type, items: [""] };
    case "tldr": return { type, text: "" };
    case "cta": return { type, title: "", ctaLabel: "", ctaHref: "" };
    case "tool-card": return { type, toolId: "" };
    case "table": return { type, headers: ["Col 1", "Col 2"], rows: [["", ""]] };
    case "comparison": return { type, tools: [], rows: [] };
    case "pros-cons": return { type, pros: [""], cons: [""] };
    case "faq": return { type, items: [{ q: "", a: "" }] };
    case "code": return { type, code: "" };
    case "video": return { type, url: "" };
    case "internal-links": return { type, links: [{ label: "", href: "" }] };
    case "newsletter": return { type };
    case "testimonial": return { type, quote: "", author: "" };
    case "steps": return { type, steps: [{ title: "", body: "" }] };
    case "how-to": return { type, name: "", steps: [{ name: "", text: "" }] };
  }
}

export default function PostEditor({ post, categories, tags, tools, onSubmit }: Props) {
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [subtitle, setSubtitle] = useState(post?.subtitle ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [status, setStatus] = useState(post?.status ?? "draft");
  const [format, setFormat] = useState(post?.format ?? "guide");
  const [categorySlug, setCategorySlug] = useState(post?.categorySlug ?? categories[0]?.slug ?? "");
  const [tagSlugsCsv, setTagSlugsCsv] = useState((post?.tagSlugs ?? []).join(", "));
  const [authorId, setAuthorId] = useState(post?.authorId ?? "team");
  const [featuredImage, setFeaturedImage] = useState(post?.featuredImage ?? "");
  const [featuredImageAlt, setFeaturedImageAlt] = useState(post?.featuredImageAlt ?? "");
  const [readTime, setReadTime] = useState(post?.readTime ?? "");
  const [scheduledFor, setScheduledFor] = useState(post?.scheduledFor ?? "");
  const [reviewToolId, setReviewToolId] = useState(post?.reviewToolId ?? "");

  const [blocks, setBlocks] = useState<Block[]>(post?.blocks ?? [{ type: "paragraph", text: "" }]);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>(post?.faqs ?? []);

  // SEO
  const [metaTitle, setMetaTitle] = useState(post?.seo?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(post?.seo?.metaDescription ?? "");
  const [canonical, setCanonical] = useState(post?.seo?.canonical ?? "");
  const [ogTitle, setOgTitle] = useState(post?.seo?.ogTitle ?? "");
  const [ogDescription, setOgDescription] = useState(post?.seo?.ogDescription ?? "");
  const [ogImage, setOgImage] = useState(post?.seo?.ogImage ?? "");

  // Strategy
  const [focusKeyword, setFocusKeyword] = useState(post?.strategy?.focusKeyword ?? "");
  const [secondaryKeywords, setSecondaryKeywords] = useState((post?.strategy?.secondaryKeywords ?? []).join(", "));
  const [intent, setIntent] = useState(post?.strategy?.intent ?? "informational");
  const [funnelStage, setFunnelStage] = useState(post?.strategy?.funnelStage ?? "TOFU");
  const [monetization, setMonetization] = useState(post?.strategy?.monetization ?? "none");
  const [affiliateArticle, setAffiliateArticle] = useState(post?.strategy?.affiliateArticle ?? false);
  const [productCta, setProductCta] = useState(post?.strategy?.productCta ?? false);

  const [tab, setTab] = useState<"content" | "seo" | "strategy" | "schema">("content");

  // Schema overrides
  const initOv: SchemaOverrides = post?.schemaOverrides ?? {};
  const [emitBlogPosting, setEmitBlogPosting] = useState(initOv.emit?.blogPosting !== false);
  const [emitBreadcrumb, setEmitBreadcrumb] = useState(initOv.emit?.breadcrumb !== false);
  const [emitFaq, setEmitFaq] = useState(initOv.emit?.faq !== false);
  const [emitReview, setEmitReview] = useState(initOv.emit?.review !== false);
  const [emitHowTo, setEmitHowTo] = useState(initOv.emit?.howTo !== false);
  const [emitVideo, setEmitVideo] = useState(initOv.emit?.videoObject !== false);
  const [useArticle, setUseArticle] = useState(initOv.emit?.article === true);
  const [ovHeadline, setOvHeadline] = useState(initOv.blogPosting?.headline ?? "");
  const [ovDescription, setOvDescription] = useState(initOv.blogPosting?.description ?? "");
  const [ovImage, setOvImage] = useState(initOv.blogPosting?.image ?? "");
  const [ratingValue, setRatingValue] = useState<number | "">(initOv.aggregateRating?.ratingValue ?? "");
  const [ratingCount, setRatingCount] = useState<number | "">(initOv.aggregateRating?.ratingCount ?? "");
  const [customJsonLd, setCustomJsonLd] = useState(
    JSON.stringify(initOv.customJsonLd ?? [], null, 2)
  );
  const [customJsonLdError, setCustomJsonLdError] = useState<string | null>(null);

  function buildSchemaOverrides(): SchemaOverrides {
    let custom: Record<string, unknown>[] = [];
    try {
      const parsed = JSON.parse(customJsonLd || "[]");
      if (Array.isArray(parsed)) custom = parsed;
      setCustomJsonLdError(null);
    } catch (e) {
      setCustomJsonLdError((e as Error).message);
    }
    return {
      emit: {
        blogPosting: emitBlogPosting,
        breadcrumb: emitBreadcrumb,
        faq: emitFaq,
        review: emitReview,
        howTo: emitHowTo,
        videoObject: emitVideo,
        article: useArticle,
      },
      blogPosting: (ovHeadline || ovDescription || ovImage)
        ? {
            headline: ovHeadline || undefined,
            description: ovDescription || undefined,
            image: ovImage || undefined,
          }
        : undefined,
      aggregateRating:
        ratingValue && ratingCount
          ? {
              ratingValue: Number(ratingValue),
              ratingCount: Number(ratingCount),
              bestRating: 5,
            }
          : undefined,
      customJsonLd: custom.length ? custom : undefined,
    };
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (post?.id) fd.set("id", post.id);
    if (post?.createdAt) fd.set("createdAt", post.createdAt);
    fd.set("blocks", JSON.stringify(blocks));
    fd.set("faqs", JSON.stringify(faqs));
    fd.set("seo", JSON.stringify({ metaTitle, metaDescription, canonical, ogTitle, ogDescription, ogImage }));
    fd.set("strategy", JSON.stringify({
      focusKeyword,
      secondaryKeywords: secondaryKeywords.split(",").map((s) => s.trim()).filter(Boolean),
      intent,
      funnelStage,
      monetization,
      affiliateArticle,
      productCta,
    }));
    fd.set("schemaOverrides", JSON.stringify(buildSchemaOverrides()));
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">{post ? "Edit Post" : "New Post"}</h1>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg">
            Save Post
          </button>
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <Field label="Title">
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input text-lg font-semibold"
            placeholder="How to..."
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Slug">
            <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} className="input" placeholder="auto-generated" />
          </Field>
          <Field label="Read Time">
            <input name="readTime" value={readTime} onChange={(e) => setReadTime(e.target.value)} className="input" placeholder="5 min read" />
          </Field>
        </div>
        <Field label="Subtitle">
          <input name="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input" />
        </Field>
        <Field label="Excerpt">
          <textarea name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className="input" rows={2} required />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Status">
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value as Post["status"])} className="input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </Field>
          <Field label="Format">
            <select name="format" value={format} onChange={(e) => setFormat(e.target.value as Post["format"])} className="input">
              {["guide","tool-review","comparison","listicle","tutorial","trend","case-study","product","beginner-guide","workflow"].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="Scheduled for (ISO)">
            <input name="scheduledFor" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} className="input" placeholder="2026-05-01T09:00:00Z" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Category">
            <select name="categorySlug" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)} className="input">
              <option value="">- select -</option>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Tags (comma sep)">
            <input name="tagSlugs" value={tagSlugsCsv} onChange={(e) => setTagSlugsCsv(e.target.value)} className="input" />
          </Field>
          <Field label="Author ID">
            <input name="authorId" value={authorId} onChange={(e) => setAuthorId(e.target.value)} className="input" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Featured Image URL">
            <input name="featuredImage" value={featuredImage} onChange={(e) => setFeaturedImage(e.target.value)} className="input" />
          </Field>
          <Field label="Image Alt">
            <input name="featuredImageAlt" value={featuredImageAlt} onChange={(e) => setFeaturedImageAlt(e.target.value)} className="input" />
          </Field>
        </div>
        {format === "tool-review" && (
          <Field label="Review Tool">
            <select name="reviewToolId" value={reviewToolId} onChange={(e) => setReviewToolId(e.target.value)} className="input">
              <option value="">- select tool -</option>
              {tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-border rounded-xl">
        <div className="border-b border-border flex">
          {(["content","seo","strategy","schema"] as const).map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-semibold capitalize ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === "content" && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-navy">Content Blocks</p>
              <p className="text-xs text-muted">Only relevant blocks render on the live page. Drag-order coming via up/down buttons.</p>

              {blocks.map((b, i) => (
                <BlockEditor
                  key={i}
                  block={b}
                  index={i}
                  total={blocks.length}
                  tools={tools}
                  onChange={(nb) => setBlocks(blocks.map((bb, j) => (j === i ? nb : bb)))}
                  onMove={(dir) => {
                    const j = i + dir;
                    if (j < 0 || j >= blocks.length) return;
                    const out = [...blocks];
                    [out[i], out[j]] = [out[j], out[i]];
                    setBlocks(out);
                  }}
                  onRemove={() => setBlocks(blocks.filter((_, j) => j !== i))}
                />
              ))}

              <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                {blockTypeOptions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBlocks([...blocks, defaultBlock(t)])}
                    className="px-2.5 py-1 text-xs text-primary bg-primary-light rounded-md hover:bg-primary hover:text-white transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>

              {/* FAQs */}
              <div className="pt-6 border-t border-border">
                <p className="text-sm font-semibold text-navy mb-2">FAQs (auto-generates FAQ schema)</p>
                {faqs.map((f, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 mb-2 space-y-2">
                    <input
                      placeholder="Question"
                      value={f.q}
                      onChange={(e) => setFaqs(faqs.map((ff, j) => (j === i ? { ...ff, q: e.target.value } : ff)))}
                      className="input"
                    />
                    <textarea
                      placeholder="Answer"
                      value={f.a}
                      onChange={(e) => setFaqs(faqs.map((ff, j) => (j === i ? { ...ff, a: e.target.value } : ff)))}
                      className="input"
                      rows={2}
                    />
                    <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} className="text-xs text-rose-500">
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setFaqs([...faqs, { q: "", a: "" }])} className="text-xs text-primary font-semibold">
                  + Add FAQ
                </button>
              </div>
            </div>
          )}

          {tab === "seo" && (
            <div className="space-y-4">
              <Field label="Meta Title">
                <input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="input" placeholder="60-70 chars" />
              </Field>
              <Field label="Meta Description">
                <textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} className="input" rows={2} placeholder="150-160 chars" />
              </Field>
              <Field label="Canonical URL">
                <input value={canonical} onChange={(e) => setCanonical(e.target.value)} className="input" />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="OG Title"><input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} className="input" /></Field>
                <Field label="OG Image URL"><input value={ogImage} onChange={(e) => setOgImage(e.target.value)} className="input" /></Field>
              </div>
              <Field label="OG Description">
                <textarea value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} className="input" rows={2} />
              </Field>
            </div>
          )}

          {tab === "strategy" && (
            <div className="space-y-4">
              <Field label="Focus Keyword">
                <input value={focusKeyword} onChange={(e) => setFocusKeyword(e.target.value)} className="input" />
              </Field>
              <Field label="Secondary Keywords (comma sep)">
                <input value={secondaryKeywords} onChange={(e) => setSecondaryKeywords(e.target.value)} className="input" />
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Search Intent">
                  <select value={intent} onChange={(e) => setIntent(e.target.value as never)} className="input">
                    {["informational","commercial","comparison","transactional","navigational"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Funnel Stage">
                  <select value={funnelStage} onChange={(e) => setFunnelStage(e.target.value as never)} className="input">
                    {["TOFU","MOFU","BOFU"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Monetization">
                  <select value={monetization} onChange={(e) => setMonetization(e.target.value as never)} className="input">
                    {["none","affiliate","adsense","product","newsletter"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
              </div>
              <div className="flex gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={affiliateArticle} onChange={(e) => setAffiliateArticle(e.target.checked)} />
                  Affiliate article (shows disclosure)
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={productCta} onChange={(e) => setProductCta(e.target.checked)} />
                  Add product CTA
                </label>
              </div>
            </div>
          )}

          {tab === "schema" && (
            <div className="space-y-6">
              {/* Toggle which schemas emit */}
              <section>
                <p className="text-sm font-semibold text-navy mb-2">Emit which schemas?</p>
                <p className="text-xs text-muted mb-3">
                  Schemas only emit if their underlying data exists. Uncheck to suppress entirely.
                </p>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <Toggle label="BlogPosting" checked={emitBlogPosting} onChange={setEmitBlogPosting} />
                  <Toggle label="BreadcrumbList" checked={emitBreadcrumb} onChange={setEmitBreadcrumb} />
                  <Toggle label="FAQPage (when FAQs exist)" checked={emitFaq} onChange={setEmitFaq} />
                  <Toggle label="Review (when format=tool-review)" checked={emitReview} onChange={setEmitReview} />
                  <Toggle label="HowTo (from how-to blocks)" checked={emitHowTo} onChange={setEmitHowTo} />
                  <Toggle label="VideoObject (from video blocks)" checked={emitVideo} onChange={setEmitVideo} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={useArticle} onChange={(e) => setUseArticle(e.target.checked)} />
                  Use <code className="bg-surface px-1 rounded">Article</code> instead of <code className="bg-surface px-1 rounded">BlogPosting</code>
                </label>
              </section>

              {/* BlogPosting overrides */}
              <section className="border-t border-border pt-5">
                <p className="text-sm font-semibold text-navy mb-3">BlogPosting field overrides (optional)</p>
                <div className="space-y-3">
                  <Field label="Override headline">
                    <input value={ovHeadline} onChange={(e) => setOvHeadline(e.target.value)} className="input" placeholder="Falls back to post title" />
                  </Field>
                  <Field label="Override description">
                    <textarea value={ovDescription} onChange={(e) => setOvDescription(e.target.value)} className="input" rows={2} placeholder="Falls back to excerpt" />
                  </Field>
                  <Field label="Override image URL">
                    <input value={ovImage} onChange={(e) => setOvImage(e.target.value)} className="input" placeholder="Falls back to featured image" />
                  </Field>
                </div>
              </section>

              {/* Aggregate rating */}
              <section className="border-t border-border pt-5">
                <p className="text-sm font-semibold text-navy mb-1">Aggregate rating (for review-style posts)</p>
                <p className="text-xs text-muted mb-3">
                  Manually set if you want Google to show stars under search results.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rating value (0-5)">
                    <input type="number" step="0.1" min="0" max="5" value={ratingValue}
                      onChange={(e) => setRatingValue(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input" />
                  </Field>
                  <Field label="Rating count">
                    <input type="number" min="0" value={ratingCount}
                      onChange={(e) => setRatingCount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="input" />
                  </Field>
                </div>
              </section>

              {/* Custom JSON-LD */}
              <section className="border-t border-border pt-5">
                <p className="text-sm font-semibold text-navy mb-1">Custom JSON-LD blocks</p>
                <p className="text-xs text-muted mb-2">
                  JSON array of arbitrary schema.org objects. Each is emitted as its own &lt;script&gt; tag.
                </p>
                <textarea
                  value={customJsonLd}
                  onChange={(e) => setCustomJsonLd(e.target.value)}
                  className="input font-mono text-xs"
                  rows={8}
                  placeholder={`[\n  { "@context": "https://schema.org", "@type": "Course", "name": "..." }\n]`}
                />
                {customJsonLdError && (
                  <p className="mt-1 text-xs text-rose-600">JSON error: {customJsonLdError}</p>
                )}
              </section>

              <div className="border-t border-border pt-5 bg-surface -mx-6 -mb-6 p-6 rounded-b-xl">
                <p className="text-xs text-muted">
                  Tip: After saving, view your post and run it through{" "}
                  <a className="text-primary underline" href="https://search.google.com/test/rich-results" target="_blank" rel="noreferrer">
                    Google Rich Results Test
                  </a>{" "}
                  to verify.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: white;
          outline: none;
          transition: border-color .15s;
        }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
      `}</style>
    </form>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 px-3 py-2 rounded-md bg-surface border border-border cursor-pointer hover:border-primary/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-slate-700">{label}</span>
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function BlockEditor({
  block,
  index,
  total,
  tools,
  onChange,
  onMove,
  onRemove,
}: {
  block: Block;
  index: number;
  total: number;
  tools: Tool[];
  onChange: (b: Block) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-border rounded-lg p-3 bg-slate-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-navy uppercase tracking-wide">{block.type}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="text-xs px-1.5 disabled:opacity-30">↑</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="text-xs px-1.5 disabled:opacity-30">↓</button>
          <button type="button" onClick={onRemove} className="text-xs text-rose-500 px-1.5">×</button>
        </div>
      </div>

      {block.type === "paragraph" && (
        <textarea className="input" rows={3} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Paragraph text" />
      )}
      {block.type === "heading" && (
        <div className="grid grid-cols-[80px_1fr] gap-2">
          <select className="input" value={block.level} onChange={(e) => onChange({ ...block, level: Number(e.target.value) as 2 | 3 | 4 })}>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
          <input className="input" value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Heading text" />
        </div>
      )}
      {block.type === "image" && (
        <div className="space-y-2">
          <input className="input" value={block.src} onChange={(e) => onChange({ ...block, src: e.target.value })} placeholder="Image URL" />
          <input className="input" value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} placeholder="Alt text" />
          <input className="input" value={block.caption ?? ""} onChange={(e) => onChange({ ...block, caption: e.target.value })} placeholder="Caption (optional)" />
        </div>
      )}
      {block.type === "quote" && (
        <div className="space-y-2">
          <textarea className="input" rows={2} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Quote text" />
          <input className="input" value={block.cite ?? ""} onChange={(e) => onChange({ ...block, cite: e.target.value })} placeholder="Source (optional)" />
        </div>
      )}
      {block.type === "callout" && (
        <div className="space-y-2">
          <select className="input" value={block.variant} onChange={(e) => onChange({ ...block, variant: e.target.value as never })}>
            {["info","warning","success","tip"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <input className="input" value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="Title (optional)" />
          <textarea className="input" rows={2} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Body" />
        </div>
      )}
      {block.type === "checklist" && (
        <ListEditor items={block.items} onChange={(items) => onChange({ ...block, items })} placeholder="Checklist item" />
      )}
      {block.type === "key-takeaways" && (
        <ListEditor items={block.items} onChange={(items) => onChange({ ...block, items })} placeholder="Takeaway" />
      )}
      {block.type === "tldr" && (
        <textarea className="input" rows={2} value={block.text} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="TL;DR summary" />
      )}
      {block.type === "cta" && (
        <div className="space-y-2">
          <input className="input" value={block.title} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="CTA title" />
          <input className="input" value={block.text ?? ""} onChange={(e) => onChange({ ...block, text: e.target.value })} placeholder="Subtitle" />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" value={block.ctaLabel} onChange={(e) => onChange({ ...block, ctaLabel: e.target.value })} placeholder="Button label" />
            <input className="input" value={block.ctaHref} onChange={(e) => onChange({ ...block, ctaHref: e.target.value })} placeholder="https://..." />
          </div>
          <select className="input" value={block.variant ?? "primary"} onChange={(e) => onChange({ ...block, variant: e.target.value as never })}>
            {["primary","accent","dark"].map((v) => <option key={v}>{v}</option>)}
          </select>
        </div>
      )}
      {block.type === "tool-card" && (
        <select className="input" value={block.toolId} onChange={(e) => onChange({ ...block, toolId: e.target.value })}>
          <option value="">- select tool -</option>
          {tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}
      {block.type === "pros-cons" && (
        <div className="grid sm:grid-cols-2 gap-2">
          <ListEditor items={block.pros} onChange={(pros) => onChange({ ...block, pros })} placeholder="Pro" />
          <ListEditor items={block.cons} onChange={(cons) => onChange({ ...block, cons })} placeholder="Con" />
        </div>
      )}
      {block.type === "faq" && (
        <div className="space-y-2">
          {block.items.map((it, i) => (
            <div key={i} className="space-y-1">
              <input
                className="input"
                value={it.q}
                onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })}
                placeholder="Question"
              />
              <textarea
                className="input"
                rows={2}
                value={it.a}
                onChange={(e) => onChange({ ...block, items: block.items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })}
                placeholder="Answer"
              />
            </div>
          ))}
          <button type="button" className="text-xs text-primary" onClick={() => onChange({ ...block, items: [...block.items, { q: "", a: "" }] })}>
            + add FAQ
          </button>
        </div>
      )}
      {block.type === "code" && (
        <div className="space-y-2">
          <input className="input" value={block.language ?? ""} onChange={(e) => onChange({ ...block, language: e.target.value })} placeholder="Language" />
          <textarea className="input font-mono text-xs" rows={5} value={block.code} onChange={(e) => onChange({ ...block, code: e.target.value })} />
        </div>
      )}
      {block.type === "video" && (
        <input className="input" value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="Embed URL (e.g. youtube.com/embed/...)" />
      )}
      {block.type === "internal-links" && (
        <div className="space-y-2">
          <input className="input" value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="Section title (optional)" />
          {block.links.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <input className="input" value={l.label} onChange={(e) => onChange({ ...block, links: block.links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Label" />
              <input className="input" value={l.href} onChange={(e) => onChange({ ...block, links: block.links.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })} placeholder="/blog/..." />
            </div>
          ))}
          <button type="button" className="text-xs text-primary" onClick={() => onChange({ ...block, links: [...block.links, { label: "", href: "" }] })}>+ add link</button>
        </div>
      )}
      {block.type === "newsletter" && <p className="text-xs text-muted">Newsletter sign-up will render here.</p>}
      {block.type === "testimonial" && (
        <div className="space-y-2">
          <textarea className="input" rows={2} value={block.quote} onChange={(e) => onChange({ ...block, quote: e.target.value })} placeholder="Quote" />
          <input className="input" value={block.author} onChange={(e) => onChange({ ...block, author: e.target.value })} placeholder="Author" />
          <input className="input" value={block.role ?? ""} onChange={(e) => onChange({ ...block, role: e.target.value })} placeholder="Role (optional)" />
        </div>
      )}
      {block.type === "steps" && (
        <div className="space-y-2">
          <input className="input" value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value })} placeholder="Section title (optional)" />
          {block.steps.map((s, i) => (
            <div key={i} className="border border-border rounded-md p-2 space-y-1">
              <input className="input" value={s.title} onChange={(e) => onChange({ ...block, steps: block.steps.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} placeholder="Step title" />
              <textarea className="input" rows={2} value={s.body} onChange={(e) => onChange({ ...block, steps: block.steps.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} placeholder="Step body" />
            </div>
          ))}
          <button type="button" className="text-xs text-primary" onClick={() => onChange({ ...block, steps: [...block.steps, { title: "", body: "" }] })}>+ add step</button>
        </div>
      )}
      {(block.type === "table" || block.type === "comparison") && (
        <p className="text-xs text-muted">Edit raw JSON for this block type below (feature coming):</p>
      )}
      {block.type === "how-to" && (
        <div className="space-y-2">
          <input className="input" value={block.name} onChange={(e) => onChange({ ...block, name: e.target.value })} placeholder="HowTo name (required for schema)" />
          <textarea className="input" rows={2} value={block.description ?? ""} onChange={(e) => onChange({ ...block, description: e.target.value })} placeholder="Short description" />
          <div className="grid grid-cols-2 gap-2">
            <input className="input" value={block.totalTime ?? ""} onChange={(e) => onChange({ ...block, totalTime: e.target.value })} placeholder="Total time (ISO 8601, e.g. PT30M)" />
            <input className="input" value={block.estimatedCost ?? ""} onChange={(e) => onChange({ ...block, estimatedCost: e.target.value })} placeholder="Estimated cost (e.g. 0)" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <textarea className="input" rows={2} value={(block.supplies ?? []).join("\n")} onChange={(e) => onChange({ ...block, supplies: e.target.value.split("\n").filter(Boolean) })} placeholder="Supplies (one per line)" />
            <textarea className="input" rows={2} value={(block.tools ?? []).join("\n")} onChange={(e) => onChange({ ...block, tools: e.target.value.split("\n").filter(Boolean) })} placeholder="Tools (one per line)" />
          </div>
          <p className="text-xs text-muted mt-2">Steps:</p>
          {block.steps.map((s, i) => (
            <div key={i} className="border border-border rounded-md p-2 space-y-1">
              <input className="input" value={s.name} onChange={(e) => onChange({ ...block, steps: block.steps.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })} placeholder={`Step ${i + 1} name`} />
              <textarea className="input" rows={2} value={s.text} onChange={(e) => onChange({ ...block, steps: block.steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} placeholder="Step text" />
              <input className="input" value={s.image ?? ""} onChange={(e) => onChange({ ...block, steps: block.steps.map((x, j) => (j === i ? { ...x, image: e.target.value } : x)) })} placeholder="Step image URL (optional)" />
            </div>
          ))}
          <button type="button" className="text-xs text-primary" onClick={() => onChange({ ...block, steps: [...block.steps, { name: "", text: "" }] })}>+ add step</button>
          <p className="text-[10px] text-muted">↑ Auto-emits HowTo JSON-LD when this block has a name + ≥1 step.</p>
        </div>
      )}
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (i: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-1">
      {items.map((it, i) => (
        <div key={i} className="flex gap-1">
          <input
            className="input flex-1"
            value={it}
            onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={placeholder}
          />
          <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-xs text-rose-500 px-2">×</button>
        </div>
      ))}
      <button type="button" className="text-xs text-primary" onClick={() => onChange([...items, ""])}>+ add</button>
    </div>
  );
}
