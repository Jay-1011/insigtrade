import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Clock, ArrowRight, Search } from "lucide-react";
import {
  getCategories,
  getPublishedPosts,
  getTags,
} from "@/lib/cms/store";
import { buildMetadata } from "@/lib/seo/metadata";
import PostImage from "@/components/PostImage";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Blog — AI, Automation & Trading Workflows",
    description:
      "In-depth guides on AI tools, trading automation, productivity systems and market research workflows for self-directed traders.",
    path: "/blog",
  });
}

export const revalidate = 600;

type Search = { search?: string; category?: string; tag?: string };

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const { search, category, tag } = await searchParams;
  const [allPosts, categories, tags] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTags(),
  ]);

  let posts = allPosts;
  if (category) posts = posts.filter((p) => p.categorySlug === category);
  if (tag) posts = posts.filter((p) => p.tagSlugs.includes(tag));
  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.strategy?.focusKeyword?.toLowerCase().includes(q) ?? false)
    );
  }

  return (
    <>
      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy">
              {category
                ? categories.find((c) => c.slug === category)?.name ?? "Blog"
                : tag
                ? `#${tags.find((t) => t.slug === tag)?.name ?? tag}`
                : "Blog"}
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Actionable guides on AI tools, trading automation, and systems
              that help you make smarter decisions in the markets.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid lg:grid-cols-[1fr_300px] gap-10">
          <div>
            {/* Active filters */}
            {(category || tag || search) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {category && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary text-sm rounded-full">
                    Category: {categories.find((c) => c.slug === category)?.name}
                    <Link href="/blog" className="text-xs">×</Link>
                  </span>
                )}
                {tag && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary text-sm rounded-full">
                    Tag: {tag}
                    <Link href="/blog" className="text-xs">×</Link>
                  </span>
                )}
                {search && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-primary-light text-primary text-sm rounded-full">
                    Search: &ldquo;{search}&rdquo;
                    <Link href="/blog" className="text-xs">×</Link>
                  </span>
                )}
              </div>
            )}

            {posts.length === 0 ? (
              <div className="p-10 rounded-xl border border-dashed border-border text-center">
                <p className="text-muted">
                  No posts yet. Check back soon — new guides coming weekly.
                </p>
                <Link
                  href="/blog"
                  className="mt-4 inline-block text-primary hover:underline text-sm"
                >
                  Clear filters
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post) => {
                  const cat = categories.find((c) => c.slug === post.categorySlug);
                  return (
                    <article
                      key={post.slug}
                      className="group flex flex-col sm:flex-row gap-6 pb-8 border-b border-border last:border-0"
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className="shrink-0 w-full sm:w-56 h-40 rounded-xl overflow-hidden bg-surface border border-border"
                      >
                        <PostImage
                          post={post}
                          category={cat ? { name: cat.name } : undefined}
                          variant="thumb"
                          className="w-full h-full object-cover"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          {cat && (
                            <Link
                              href={`/category/${cat.slug}`}
                              className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-primary bg-primary-light rounded-full hover:bg-primary hover:text-white transition-colors"
                            >
                              {cat.name}
                            </Link>
                          )}
                          {post.readTime && (
                            <span className="flex items-center gap-1 text-xs text-muted">
                              <Clock className="w-3 h-3" />
                              {post.readTime}
                            </span>
                          )}
                        </div>
                        <h2 className="text-xl font-bold text-navy group-hover:text-primary transition-colors leading-snug">
                          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                        </h2>
                        <p className="mt-2 text-sm text-muted leading-relaxed">
                          {post.excerpt}
                        </p>
                        <Link
                          href={`/blog/${post.slug}`}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                        >
                          Read More <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-8">
            <form action="/blog">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search}
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-surface border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
              </div>
            </form>

            {categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">
                  Categories
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/category/${cat.slug}`}
                      className="flex items-center justify-between p-3 bg-surface rounded-lg hover:bg-primary-light transition-colors group"
                    >
                      <div>
                        <span className="text-sm font-medium text-navy group-hover:text-primary transition-colors">
                          {cat.name}
                        </span>
                        {cat.description && (
                          <p className="text-xs text-muted mt-0.5 line-clamp-2">
                            {cat.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-navy uppercase tracking-wider mb-4">
                  Popular Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 12).map((t) => (
                    <Link
                      key={t.slug}
                      href={`/tag/${t.slug}`}
                      className="px-2.5 py-1 text-xs bg-surface border border-border rounded-full hover:border-primary hover:text-primary transition-colors"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-navy rounded-xl p-6 text-white">
              <h3 className="font-bold mb-2">Get Weekly Insights</h3>
              <p className="text-sm text-white/60 mb-4">
                The best AI trading content, delivered free every week.
              </p>
              <form className="space-y-3">
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/40 outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
