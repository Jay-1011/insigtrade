import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, ExternalLink, Check, X, ArrowLeft } from "lucide-react";
import { getToolBySlug, getTools } from "@/lib/cms/store";
import { buildMetadata } from "@/lib/seo/metadata";
import { softwareSchema, breadcrumbSchema } from "@/lib/schema/jsonld";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tools = await getTools();
  return tools.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) return { title: "Not Found" };
  return buildMetadata({
    title: `${tool.name} Review — ${tool.tagline}`,
    description: tool.description,
    path: `/reviews/${tool.slug}`,
  });
}

export const revalidate = 3600;

export default async function ToolReviewPage({ params }: Props) {
  const { slug } = await params;
  const tool = await getToolBySlug(slug);
  if (!tool) notFound();

  const swLd = softwareSchema(tool);
  const bcLd = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: "Reviews", href: "/reviews" },
    { name: tool.name, href: `/reviews/${tool.slug}` },
  ]);

  return (
    <>
      {swLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(swLd) }} />
      )}
      {bcLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcLd) }} />
      )}

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <Link href="/reviews" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> All Reviews
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-6 pb-8 border-b border-border">
          <div className="shrink-0 w-20 h-20 rounded-2xl bg-primary-light flex items-center justify-center text-primary font-bold text-3xl">
            {tool.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy">{tool.name}</h1>
            <p className="mt-1 text-lg text-muted">{tool.tagline}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="font-bold text-navy">{tool.rating}</span>
                <span className="text-sm text-muted">/ 5.0</span>
              </div>
              <span className="text-sm text-muted">•</span>
              <span className="text-sm text-muted">{tool.category}</span>
              <span className="text-sm text-muted">•</span>
              <span className="text-sm font-medium text-navy">{tool.pricing}</span>
            </div>
            <a
              href={tool.affiliateUrl ?? tool.website}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              Try {tool.name} <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Description */}
        <section className="my-8">
          <h2 className="text-2xl font-bold text-navy mb-3">Overview</h2>
          <p className="text-slate-700 leading-relaxed">{tool.description}</p>
        </section>

        {/* Features */}
        {tool.features.length > 0 && (
          <section className="my-8">
            <h2 className="text-2xl font-bold text-navy mb-3">Key Features</h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {tool.features.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pros/Cons */}
        {(tool.pros.length > 0 || tool.cons.length > 0) && (
          <section className="my-8 grid sm:grid-cols-2 gap-4">
            {tool.pros.length > 0 && (
              <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50">
                <p className="font-bold text-emerald-700 mb-3">Pros</p>
                <ul className="space-y-2">
                  {tool.pros.map((p, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tool.cons.length > 0 && (
              <div className="p-5 rounded-xl border border-rose-200 bg-rose-50">
                <p className="font-bold text-rose-700 mb-3">Cons</p>
                <ul className="space-y-2">
                  {tool.cons.map((c, i) => (
                    <li key={i} className="text-sm text-slate-700 flex gap-2">
                      <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" /> {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Use cases */}
        {tool.useCases.length > 0 && (
          <section className="my-8">
            <h2 className="text-2xl font-bold text-navy mb-3">Best Use Cases</h2>
            <ul className="space-y-2">
              {tool.useCases.map((u, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <span className="text-primary font-bold">→</span> {u}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Verdict */}
        {tool.verdict && (
          <section className="my-8 p-6 bg-navy text-white rounded-2xl">
            <h2 className="text-xl font-bold mb-2">Final Verdict</h2>
            <p className="text-white/80 leading-relaxed">{tool.verdict}</p>
            <a
              href={tool.affiliateUrl ?? tool.website}
              target="_blank"
              rel="noopener nofollow sponsored"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-navy bg-white hover:bg-surface rounded-lg transition-colors"
            >
              Try {tool.name} <ExternalLink className="w-4 h-4" />
            </a>
          </section>
        )}

        <p className="mt-10 text-xs text-muted border-t border-border pt-4">
          <strong>Disclosure:</strong> This page may contain affiliate links. We
          earn a small commission if you sign up — at no extra cost to you.
        </p>
      </article>
    </>
  );
}
