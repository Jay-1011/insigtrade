import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3 } from "lucide-react";
import {
  getPublishedPosts,
  getTagBySlug,
  getTags,
} from "@/lib/cms/store";
import { buildMetadata } from "@/lib/seo/metadata";
import PostImage from "@/components/PostImage";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const tags = await getTags();
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Not Found" };
  return buildMetadata({
    title: `${tag.name}: Articles`,
    description: tag.description ?? `Articles tagged with ${tag.name}`,
    path: `/tag/${tag.slug}`,
  });
}

export const revalidate = 1800;

export default async function TagPage({ params }: Props) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();
  const allPosts = await getPublishedPosts();
  const posts = allPosts.filter((p) => p.tagSlugs.includes(slug));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <p className="text-sm font-semibold text-primary uppercase tracking-wide">
        Tag
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-navy">
        #{tag.name}
      </h1>
      {tag.description && (
        <p className="mt-3 text-muted">{tag.description}</p>
      )}

      {posts.length === 0 ? (
        <p className="mt-10 text-muted">No posts with this tag yet.</p>
      ) : (
        <div className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group p-5 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="h-32 rounded-lg overflow-hidden bg-surface mb-4">
                <PostImage post={p} variant="thumb" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-navy text-base leading-snug group-hover:text-primary transition-colors">
                {p.title}
              </h3>
              <p className="mt-2 text-sm text-muted line-clamp-2">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
