import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BarChart3 } from "lucide-react";
import {
  getCategories,
  getCategoryBySlug,
  getPublishedPosts,
} from "@/lib/cms/store";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema } from "@/lib/schema/jsonld";
import PostImage from "@/components/PostImage";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const cats = await getCategories();
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return { title: "Not Found" };
  return buildMetadata({
    title: cat.seoTitle ?? `${cat.name}: Insigtrade`,
    description: cat.seoDescription ?? cat.description,
    path: `/category/${cat.slug}`,
  });
}

export const revalidate = 1800;

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const allPosts = await getPublishedPosts();
  const posts = allPosts.filter((p) => p.categorySlug === slug);

  const breadcrumbs = breadcrumbSchema([
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: cat.name, href: `/category/${cat.slug}` },
  ]);
  const faqLd = faqSchema(cat.faqs);

  return (
    <>
      {breadcrumbs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
        />
      )}
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}

      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">
              Category
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-navy">
              {cat.name}
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              {cat.description}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {posts.length === 0 ? (
          <p className="text-muted text-center py-10">
            No posts in this category yet.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <article
                key={p.slug}
                className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
              >
                <Link
                  href={`/blog/${p.slug}`}
                  className="block h-40 overflow-hidden bg-surface"
                >
                  <PostImage
                    post={p}
                    category={{ name: cat.name }}
                    variant="thumb"
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="p-5">
                  <h3 className="font-bold text-navy text-base leading-snug group-hover:text-primary transition-colors">
                    <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                  </h3>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{p.excerpt}</p>
                  <Link
                    href={`/blog/${p.slug}`}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                  >
                    Read <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {cat.faqs && cat.faqs.length > 0 && (
          <section className="mt-16 max-w-3xl">
            <h2 className="text-2xl font-bold text-navy mb-5">FAQs</h2>
            <div className="space-y-3">
              {cat.faqs.map((f, i) => (
                <details
                  key={i}
                  className="p-5 rounded-xl border border-border bg-white"
                >
                  <summary className="cursor-pointer font-semibold text-navy">
                    {f.q}
                  </summary>
                  <p className="mt-3 text-sm text-slate-700 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
