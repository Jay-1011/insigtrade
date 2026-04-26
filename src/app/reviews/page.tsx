import type { Metadata } from "next";
import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { getTools } from "@/lib/cms/store";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Tool Reviews — AI & Trading Tools Tested",
    description:
      "Honest, hands-on reviews of AI and automation tools for traders. Pricing, features, pros, cons and verdicts.",
    path: "/reviews",
  });
}

export const revalidate = 1800;

export default async function ReviewsPage() {
  const tools = await getTools();

  return (
    <>
      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <h1 className="text-3xl sm:text-4xl font-bold text-navy">Tool Reviews</h1>
          <p className="mt-4 text-lg text-muted max-w-2xl">
            Hand-tested reviews of AI tools, trading platforms, journals and
            automation services. Updated as new versions ship.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {tools.length === 0 ? (
          <p className="text-center text-muted py-12">No reviews yet — coming soon.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all relative"
              >
                {tool.badge && (
                  <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary-light rounded-full">
                    {tool.badge}
                  </span>
                )}
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold mb-4">
                  {tool.name.charAt(0)}
                </div>
                <h3 className="text-lg font-bold text-navy mb-1">
                  <Link href={`/reviews/${tool.slug}`} className="hover:text-primary">
                    {tool.name}
                  </Link>
                </h3>
                <p className="text-sm text-muted mb-4">{tool.tagline}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-navy">{tool.rating}</span>
                  </div>
                  <span className="text-sm text-muted">{tool.pricing}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/reviews/${tool.slug}`}
                    className="flex-1 text-center px-3 py-2 text-xs font-semibold text-primary bg-primary-light rounded-lg hover:bg-primary hover:text-white transition-colors"
                  >
                    Read Review
                  </Link>
                  <a
                    href={tool.affiliateUrl ?? tool.website}
                    target="_blank"
                    rel="noopener nofollow sponsored"
                    className="px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
