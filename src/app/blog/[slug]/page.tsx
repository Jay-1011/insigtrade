import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User as UserIcon } from "lucide-react";
import {
  getAuthorById,
  getCategoryBySlug,
  getPostBySlug,
  getPublishedPosts,
  getSchemaConfig,
  getTools,
} from "@/lib/cms/store";
import { metadataForPost } from "@/lib/seo/metadata";
import { buildPostSchemas } from "@/lib/schema/jsonld";
import { BlockRenderer, buildToc } from "@/components/blocks/BlockRenderer";
import PostImage from "@/components/PostImage";
import Avatar from "@/components/Avatar";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not Found" };
  const author = await getAuthorById(post.authorId);
  return metadataForPost(post, author?.name);
}

export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || (post.status !== "published" &&
    !(post.status === "scheduled" && post.scheduledFor && post.scheduledFor <= new Date().toISOString()))) {
    notFound();
  }

  const [author, category, tools, allPosts, schemaCfg] = await Promise.all([
    getAuthorById(post.authorId),
    getCategoryBySlug(post.categorySlug),
    getTools(),
    getPublishedPosts(),
    getSchemaConfig(),
  ]);

  // Related posts: same category, exclude self, max 3
  const related = allPosts
    .filter((p) => p.slug !== post.slug && p.categorySlug === post.categorySlug)
    .slice(0, 3);

  const toc = buildToc(post.blocks);

  // Optional review tool (for tool-review format)
  const reviewTool =
    post.format === "tool-review" && post.reviewToolId
      ? tools.find((t) => t.id === post.reviewToolId) ?? null
      : null;

  // Orchestrated schema build (handles overrides, HowTo, VideoObject, FAQ, Review, etc.)
  const schemas = buildPostSchemas({
    post,
    author,
    tool: reviewTool,
    category: category ? { slug: category.slug, name: category.name } : null,
    cfg: schemaCfg,
  });

  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      {/* JSON-LD (orchestrated, honors per-post overrides + global config) */}
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="text-sm mb-6">
          <ol className="flex items-center gap-2 text-muted">
            <li><Link href="/" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
            {category && (
              <>
                <li>/</li>
                <li>
                  <Link href={`/category/${category.slug}`} className="hover:text-primary">
                    {category.name}
                  </Link>
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-8">
          {category && (
            <Link
              href={`/category/${category.slug}`}
              className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-primary bg-primary-light rounded-full mb-4 hover:bg-primary hover:text-white transition-colors"
            >
              {category.name}
            </Link>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight">
            {post.title}
          </h1>
          {post.subtitle && (
            <p className="mt-4 text-lg text-muted leading-relaxed">{post.subtitle}</p>
          )}
          {/* Hero image — branded OG fallback if no custom image */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-border shadow-sm">
            <PostImage
              post={post}
              category={category ? { name: category.name } : undefined}
              variant="hero"
              className="w-full h-auto"
              priority
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted border-b border-border pb-6">
            {author && (
              <span className="flex items-center gap-2">
                <Avatar name={author.name} src={author.avatar} size={28} />
                <span className="font-medium text-navy">{author.name}</span>
              </span>
            )}
            {formattedDate && (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
            )}
            {post.readTime && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            )}
          </div>
        </header>

        {/* TOC (only show if 3+ headings) */}
        {toc.length >= 3 && (
          <aside className="my-8 p-5 bg-surface rounded-xl border border-border">
            <p className="text-sm font-bold text-navy uppercase tracking-wide mb-3">
              Table of Contents
            </p>
            <ul className="space-y-1.5">
              {toc.map((t) => (
                <li key={t.id}>
                  <a
                    href={`#${t.id}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {t.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Dynamic Blocks */}
        <div className="article-body">
          {post.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} tools={tools} />
          ))}
        </div>

        {/* Inline FAQs (if not already a block) */}
        {post.faqs && post.faqs.length > 0 && !post.blocks.some((b) => b.type === "faq") && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-navy mb-5">Frequently Asked Questions</h2>
            <BlockRenderer block={{ type: "faq", items: post.faqs }} tools={tools} />
          </section>
        )}

        {/* Affiliate disclaimer for affiliate articles */}
        {post.strategy?.affiliateArticle && (
          <p className="mt-12 text-xs text-muted border-t border-border pt-6">
            <strong>Disclosure:</strong> Some links above are affiliate links.
            If you click and purchase, Insigtrade may earn a small commission at
            no extra cost to you. We only recommend tools we&apos;ve tested.
          </p>
        )}

        {/* Author bio */}
        {author && author.bio && (
          <aside className="mt-10 p-6 bg-surface rounded-2xl border border-border flex gap-4">
            <Avatar name={author.name} src={author.avatar} size={48} />
            <div>
              <p className="font-semibold text-navy">{author.name}</p>
              {author.role && <p className="text-xs text-muted">{author.role}</p>}
              <p className="mt-2 text-sm text-slate-700 leading-relaxed">{author.bio}</p>
            </div>
          </aside>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-2xl font-bold text-navy mb-5">Related Articles</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {p.format.replace("-", " ")}
                  </span>
                  <h3 className="mt-2 font-bold text-navy group-hover:text-primary transition-colors text-base leading-snug">
                    {p.title}
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>
        </div>
      </article>
    </>
  );
}
