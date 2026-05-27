// Featured-image renderer with a sane fallback chain:
//   1. post.featuredImage (if explicitly set)
//   2. dynamic OG image generator (always available, branded)
//
// Use anywhere a post needs a hero/thumb. Aspect ratios match the OG 1200×630.

import type { Post } from "@/lib/cms/types";

interface Props {
  post: Pick<Post, "title" | "format" | "featuredImage" | "featuredImageAlt" | "categorySlug">;
  className?: string;
  category?: { name: string };
  priority?: boolean;
  /** Visual size, affects the rendered <img> width param sent to OG. */
  variant?: "card" | "hero" | "thumb";
}

export default function PostImage({
  post,
  category,
  className = "",
  variant = "card",
}: Props) {
  const sizes = {
    thumb: { width: 600, height: 315 },
    card: { width: 1200, height: 630 },
    hero: { width: 1600, height: 840 },
  } as const;
  const { width, height } = sizes[variant];

  // If a custom featuredImage is set, prefer it
  const src =
    post.featuredImage ||
    `/api/og?title=${encodeURIComponent(post.title)}&category=${encodeURIComponent(
      category?.name ?? post.categorySlug ?? "Insigtrade"
    )}&format=${encodeURIComponent(post.format)}`;

  const alt =
    post.featuredImageAlt ??
    `${post.title}: Insigtrade ${post.format.replace("-", " ")}`;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={variant === "hero" ? "eager" : "lazy"}
      className={className}
    />
  );
}
