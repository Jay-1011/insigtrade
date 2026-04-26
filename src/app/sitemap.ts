import type { MetadataRoute } from "next";
import { site } from "@/lib/seo/site";
import {
  getCategories,
  getPublishedPosts,
  getTags,
  getTools,
} from "@/lib/cms/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, tools] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTags(),
    getTools(),
  ]);

  const base = site.url.replace(/\/$/, "");

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/reviews`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/products`, changeFrequency: "weekly", priority: 0.6 },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${base}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${base}/tag/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const toolEntries: MetadataRoute.Sitemap = tools.map((t) => ({
    url: `${base}/reviews/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    ...staticEntries,
    ...postEntries,
    ...categoryEntries,
    ...tagEntries,
    ...toolEntries,
  ];
}
