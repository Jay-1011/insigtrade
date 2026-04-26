import type { Metadata } from "next";
import { site, absoluteUrl } from "./site";
import type { Post } from "@/lib/cms/types";

interface BuildMetaArgs {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  type?: "website" | "article";
  publishedAt?: string;
  updatedAt?: string;
  authorName?: string;
  keywords?: string[];
}

export function buildMetadata(args: BuildMetaArgs = {}): Metadata {
  const title = args.title ?? site.name;
  const description = args.description ?? site.description;
  const url = absoluteUrl(args.path ?? "/");
  const image = args.image
    ? args.image.startsWith("http")
      ? args.image
      : absoluteUrl(args.image)
    : absoluteUrl(site.defaultOgImage);

  const meta: Metadata = {
    title,
    description,
    keywords: args.keywords,
    alternates: { canonical: url },
    robots: args.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      type: args.type ?? "website",
      ...(args.type === "article" && {
        publishedTime: args.publishedAt,
        modifiedTime: args.updatedAt,
        authors: args.authorName ? [args.authorName] : undefined,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      site: site.twitter,
    },
  };
  return meta;
}

export function metadataForPost(post: Post, authorName?: string): Metadata {
  const title = post.seo?.metaTitle ?? post.title;
  const description =
    post.seo?.metaDescription ?? post.excerpt ?? site.description;
  return buildMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    image: post.seo?.ogImage ?? post.featuredImage,
    type: "article",
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    authorName,
    keywords: [
      ...(post.strategy?.focusKeyword ? [post.strategy.focusKeyword] : []),
      ...(post.strategy?.secondaryKeywords ?? []),
    ],
  });
}
