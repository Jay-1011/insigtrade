import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Calculator from "@/components/Calculator";
import { calculators, getCalculatorBySlug } from "@/lib/calculators/registry";
import { site, absoluteUrl } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return calculators.map((c) => ({ slug: c.slug }));
}

export const revalidate = 86400; // 1 day — calculators are static logic

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const calc = getCalculatorBySlug(slug);
  if (!calc) return { title: "Calculator not found" };
  const url = absoluteUrl(`/calculators/${calc.slug}`);
  return {
    title: calc.title,
    description: calc.metaDescription,
    alternates: { canonical: url },
    keywords: [calc.focusKeyword, ...(calc.secondaryKeywords ?? [])].join(", "),
    openGraph: {
      title: calc.title,
      description: calc.metaDescription,
      type: "website",
      url,
      siteName: site.name,
    },
    twitter: {
      card: "summary_large_image",
      title: calc.title,
      description: calc.metaDescription,
    },
  };
}

export default async function CalculatorPage({ params }: Props) {
  const { slug } = await params;
  const calc = getCalculatorBySlug(slug);
  if (!calc) notFound();

  const url = absoluteUrl(`/calculators/${calc.slug}`);

  // ── JSON-LD ────────────────────────────────────────────────
  // WebApplication is the correct type for an interactive online tool.
  // FAQPage gets us People-Also-Ask eligibility. BreadcrumbList helps
  // both Google's breadcrumb display and AI search context.
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: calc.title,
      url,
      description: calc.metaDescription,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      browserRequirements: "Requires JavaScript",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
      author: { "@type": "Organization", name: site.name, url: site.url },
      keywords: [calc.focusKeyword, ...(calc.secondaryKeywords ?? [])].join(", "),
      inLanguage: "en-US",
      // Speakable for the intro (so AI assistants read the direct answer)
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".speakable-summary"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: calc.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        {
          "@type": "ListItem",
          position: 2,
          name: "Calculators",
          item: absoluteUrl("/calculators"),
        },
        { "@type": "ListItem", position: 3, name: calc.title, item: url },
      ],
    },
  ];

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}

      <article className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-muted">
            <li>
              <Link href="/" className="hover:text-primary">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/calculators" className="hover:text-primary">
                Calculators
              </Link>
            </li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl sm:text-4xl font-bold text-navy leading-tight">
          {calc.title}
        </h1>

        {/* Direct-answer intro — AEO Speakable target */}
        <p className="speakable-summary mt-4 text-lg text-slate-700 leading-relaxed max-w-3xl">
          {calc.intro}
        </p>

        {/* The actual calculator (client component looks up its own
            config — server can't serialize the compute function over) */}
        <Calculator slug={calc.slug} />

        {/* Worked example */}
        <section className="my-10 p-6 bg-surface rounded-xl border-l-4 border-accent">
          <h2 className="text-sm font-bold text-accent uppercase tracking-wide mb-2">
            {calc.example.title}
          </h2>
          <p className="text-base text-slate-700 leading-relaxed">
            {calc.example.explanation}
          </p>
        </section>

        {/* FAQ */}
        <section className="my-10">
          <h2 className="text-2xl font-bold text-navy mb-6">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {calc.faqs.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-white p-5"
              >
                <h3 className="font-semibold text-navy mb-2">{f.q}</h3>
                <p className="text-sm text-slate-700 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Back to hub */}
        <div className="mt-12">
          <Link
            href="/calculators"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
          >
            <ArrowLeft className="w-4 h-4" />
            All calculators
          </Link>
        </div>
      </article>
    </>
  );
}
