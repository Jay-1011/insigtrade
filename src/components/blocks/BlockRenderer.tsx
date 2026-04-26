import Link from "next/link";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Check,
  X,
  Star,
  ExternalLink,
} from "lucide-react";
import type { Block, Tool } from "@/lib/cms/types";
import NewsletterForm from "@/components/NewsletterForm";

const calloutStyles = {
  info: { icon: Info, bg: "bg-blue-50", border: "border-blue-200", iconColor: "text-blue-600" },
  warning: { icon: AlertTriangle, bg: "bg-amber-50", border: "border-amber-200", iconColor: "text-amber-600" },
  success: { icon: CheckCircle2, bg: "bg-emerald-50", border: "border-emerald-200", iconColor: "text-emerald-600" },
  tip: { icon: Lightbulb, bg: "bg-violet-50", border: "border-violet-200", iconColor: "text-violet-600" },
} as const;

function slugId(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function BlockRenderer({
  block,
  tools = [],
}: {
  block: Block;
  tools?: Tool[];
}) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-5">
          {block.text}
        </p>
      );

    case "heading": {
      const id = block.id ?? slugId(block.text);
      const sizes = {
        2: "text-2xl sm:text-3xl mt-12 mb-5",
        3: "text-xl sm:text-2xl mt-10 mb-4",
        4: "text-lg sm:text-xl mt-8 mb-3",
      } as const;
      const className = `font-bold text-navy scroll-mt-24 ${sizes[block.level]}`;
      if (block.level === 2) return <h2 id={id} className={className}>{block.text}</h2>;
      if (block.level === 3) return <h3 id={id} className={className}>{block.text}</h3>;
      return <h4 id={id} className={className}>{block.text}</h4>;
    }

    case "image":
      return (
        <figure className="my-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.src}
            alt={block.alt}
            className="w-full rounded-xl border border-border"
            loading="lazy"
          />
          {block.caption && (
            <figcaption className="mt-2 text-sm text-muted text-center">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "quote":
      return (
        <blockquote className="my-8 pl-6 border-l-4 border-primary italic text-slate-700">
          <p className="text-lg leading-relaxed">&ldquo;{block.text}&rdquo;</p>
          {block.cite && (
            <cite className="mt-2 block text-sm not-italic text-muted">
              — {block.cite}
            </cite>
          )}
        </blockquote>
      );

    case "callout": {
      const cfg = calloutStyles[block.variant];
      const Icon = cfg.icon;
      return (
        <div className={`my-6 p-5 rounded-xl border ${cfg.bg} ${cfg.border} flex gap-3`}>
          <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
          <div>
            {block.title && (
              <p className="font-semibold text-navy mb-1">{block.title}</p>
            )}
            <p className="text-sm text-slate-700 leading-relaxed">{block.text}</p>
          </div>
        </div>
      );
    }

    case "checklist":
      return (
        <ul className="my-6 space-y-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="flex gap-2 text-base text-slate-700">
              <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      );

    case "key-takeaways":
      return (
        <div className="my-8 p-6 bg-primary-light rounded-xl border border-primary/20">
          <p className="text-sm font-bold text-navy uppercase tracking-wide mb-3">
            Key Takeaways
          </p>
          <ul className="space-y-2">
            {block.items.map((it, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-700">
                <span className="text-primary font-bold">{i + 1}.</span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "tldr":
      return (
        <div className="my-8 p-6 bg-surface rounded-xl border-l-4 border-accent">
          <p className="text-xs font-bold text-accent uppercase tracking-wide mb-2">
            TL;DR
          </p>
          <p className="text-base text-slate-700 leading-relaxed">
            {block.text}
          </p>
        </div>
      );

    case "cta": {
      const variants = {
        primary: "bg-primary hover:bg-primary-dark text-white",
        accent: "bg-accent hover:bg-accent-dark text-white",
        dark: "bg-navy hover:bg-navy-light text-white",
      } as const;
      const v = block.variant ?? "primary";
      return (
        <div className="my-10 p-8 bg-gradient-to-br from-surface to-primary-light/40 rounded-2xl border border-border text-center">
          <h3 className="text-xl font-bold text-navy mb-2">{block.title}</h3>
          {block.text && (
            <p className="text-muted mb-5 max-w-md mx-auto">{block.text}</p>
          )}
          <a
            href={block.ctaHref}
            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg transition-colors ${variants[v]}`}
            target={block.ctaHref.startsWith("http") ? "_blank" : undefined}
            rel={block.ctaHref.startsWith("http") ? "noopener nofollow sponsored" : undefined}
          >
            {block.ctaLabel}
            {block.ctaHref.startsWith("http") && <ExternalLink className="w-4 h-4" />}
          </a>
        </div>
      );
    }

    case "tool-card": {
      const tool = tools.find((t) => t.id === block.toolId);
      if (!tool) return null;
      return (
        <div className="my-8 p-6 rounded-2xl border border-border bg-white hover:shadow-lg transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="shrink-0 w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold">
              {tool.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h4 className="font-bold text-lg text-navy">{tool.name}</h4>
                  <p className="text-sm text-muted">{tool.tagline}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-sm font-semibold text-navy">{tool.rating}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-700">{tool.description}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-medium text-navy">{tool.pricing}</span>
                <a
                  href={tool.affiliateUrl ?? tool.website}
                  target="_blank"
                  rel="noopener nofollow sponsored"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                >
                  Try {tool.name}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    case "table":
      return (
        <div className="my-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="text-left px-4 py-3 font-semibold text-navy">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-3 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "comparison": {
      const compTools = block.tools
        .map((id) => tools.find((t) => t.id === id))
        .filter((t): t is Tool => Boolean(t));
      if (compTools.length === 0) return null;
      return (
        <div className="my-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-navy">Feature</th>
                {compTools.map((t) => (
                  <th key={t.id} className="text-left px-4 py-3 font-semibold text-navy">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 font-medium text-navy">{row.label}</td>
                  {row.values.map((v, j) => (
                    <td key={j} className="px-4 py-3 text-slate-700">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case "pros-cons":
      return (
        <div className="my-8 grid sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50">
            <p className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
              <Check className="w-4 h-4" /> Pros
            </p>
            <ul className="space-y-2">
              {block.pros.map((p, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50">
            <p className="font-bold text-rose-700 mb-3 flex items-center gap-2">
              <X className="w-4 h-4" /> Cons
            </p>
            <ul className="space-y-2">
              {block.cons.map((c, i) => (
                <li key={i} className="text-sm text-slate-700 flex gap-2">
                  <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );

    case "faq":
      return (
        <div className="my-8 space-y-3">
          {block.items.map((it, i) => (
            <details
              key={i}
              className="group p-5 rounded-xl border border-border bg-white"
            >
              <summary className="cursor-pointer font-semibold text-navy list-none flex items-start justify-between gap-3">
                {it.q}
                <span className="text-primary shrink-0 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-slate-700 leading-relaxed">{it.a}</p>
            </details>
          ))}
        </div>
      );

    case "code":
      return (
        <pre className="my-6 p-4 bg-navy text-slate-100 rounded-xl overflow-x-auto text-sm">
          <code>{block.code}</code>
        </pre>
      );

    case "video":
      return (
        <div className="my-8 aspect-video rounded-xl overflow-hidden bg-navy">
          <iframe
            src={block.url}
            title={block.title ?? "Video"}
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );

    case "internal-links":
      return (
        <div className="my-8 p-5 bg-surface rounded-xl border border-border">
          {block.title && (
            <p className="text-sm font-semibold text-navy uppercase tracking-wide mb-3">
              {block.title}
            </p>
          )}
          <ul className="space-y-1.5">
            {block.links.map((l, i) => (
              <li key={i}>
                <Link href={l.href} className="text-primary hover:underline text-sm">
                  → {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      );

    case "newsletter":
      return (
        <div className="my-10 p-8 rounded-2xl bg-navy text-white text-center">
          <h3 className="text-xl font-bold mb-2">Get smarter trades, weekly</h3>
          <p className="text-white/60 mb-5 text-sm">
            One short email every Sunday. AI workflows, tool reviews, and trader productivity tips.
          </p>
          <NewsletterForm variant="dark" />
        </div>
      );

    case "testimonial":
      return (
        <div className="my-8 p-6 rounded-xl bg-surface border border-border">
          <p className="text-base italic text-slate-700">&ldquo;{block.quote}&rdquo;</p>
          <p className="mt-3 text-sm font-semibold text-navy">
            — {block.author}
            {block.role && <span className="text-muted font-normal">, {block.role}</span>}
          </p>
        </div>
      );

    case "steps":
      return (
        <div className="my-8">
          {block.title && (
            <p className="text-sm font-semibold text-navy uppercase tracking-wide mb-4">
              {block.title}
            </p>
          )}
          <ol className="space-y-5">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold text-navy mb-1">{s.title}</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    case "how-to":
      return (
        <section className="my-10 p-6 rounded-2xl border border-border bg-white">
          <p className="text-xs font-bold text-primary uppercase tracking-wide">How-To</p>
          <h3 className="text-2xl font-bold text-navy mt-1">{block.name}</h3>
          {block.description && (
            <p className="mt-2 text-slate-700 leading-relaxed">{block.description}</p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
            {block.totalTime && <span>⏱ {block.totalTime}</span>}
            {block.estimatedCost && <span>💰 {block.estimatedCost}</span>}
          </div>
          {(block.supplies?.length || block.tools?.length) && (
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              {block.supplies?.length && (
                <div>
                  <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Supplies</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {block.supplies.map((s, i) => <li key={i}>• {s}</li>)}
                  </ul>
                </div>
              )}
              {block.tools?.length && (
                <div>
                  <p className="text-xs font-semibold text-navy uppercase tracking-wide mb-2">Tools</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {block.tools.map((t, i) => <li key={i}>• {t}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          <ol className="mt-6 space-y-5">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-navy mb-1">{s.name}</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{s.text}</p>
                  {s.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.name} className="mt-2 rounded-lg border border-border max-w-md" loading="lazy" />
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-[10px] text-muted">↑ This block also emits <code>HowTo</code> JSON-LD for rich results.</p>
        </section>
      );

    default:
      return null;
  }
}

// Auto-generated TOC from heading blocks
export function buildToc(blocks: Block[]): { id: string; text: string; level: number }[] {
  return blocks
    .filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading" && b.level === 2)
    .map((b) => ({
      id: b.id ?? slugId(b.text),
      text: b.text,
      level: b.level,
    }));
}
