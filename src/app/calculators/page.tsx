import type { Metadata } from "next";
import Link from "next/link";
import { Calculator as CalcIcon } from "lucide-react";
import { calculators } from "@/lib/calculators/registry";
import { site, absoluteUrl } from "@/lib/seo/site";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Free Trading Calculators (Position Size, R:R, Kelly & More)",
  description:
    "Free, browser-based trading calculators built by Insigtrade. Position size, risk/reward, Kelly criterion, and more — no signup, your numbers never leave your device.",
  alternates: { canonical: absoluteUrl("/calculators") },
};

export default function CalculatorsHub() {
  // JSON-LD: ItemList of WebApplications — helps Google + AI search
  // understand the hub as a curated collection.
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trading calculators",
    url: absoluteUrl("/calculators"),
    description:
      "Free, browser-based trading calculators for position sizing, risk management, and trade planning.",
    isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: calculators.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "WebApplication",
          name: c.title,
          url: absoluteUrl(`/calculators/${c.slug}`),
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          isAccessibleForFree: true,
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-muted">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li>/</li>
            <li className="text-navy font-medium">Calculators</li>
          </ol>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-navy leading-tight">
          Free trading calculators
        </h1>

        <p className="speakable-summary mt-4 text-lg text-slate-700 leading-relaxed max-w-3xl">
          Free, browser-based tools for sizing positions, planning trades, and
          stress-testing your risk. Every calculator runs entirely on your
          device — no signup, no tracking, no data sent to a server. We built
          these because we use them ourselves every trading day.
        </p>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-5">
          {calculators.map((c) => (
            <Link
              key={c.slug}
              href={`/calculators/${c.slug}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-primary transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
                  <CalcIcon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Calculator
                </span>
              </div>
              <h2 className="text-xl font-bold text-navy group-hover:text-primary transition mb-2">
                {c.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {c.metaDescription}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-12 p-6 bg-surface rounded-xl border-l-4 border-accent">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wide mb-2">
            More on the way
          </h2>
          <p className="text-base text-slate-700 leading-relaxed">
            We&apos;re rolling out a new calculator every week, prioritized by what
            traders actually search for: Kelly criterion, forex + futures
            position sizing, risk-of-ruin, stop-loss distance, and compound
            interest. Bookmark this page or join the newsletter to know when
            they go live.
          </p>
        </div>
      </section>
    </>
  );
}
