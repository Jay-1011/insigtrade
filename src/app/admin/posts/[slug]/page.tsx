import { notFound, redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/cms/auth";
import {
  getCategories,
  getPostBySlug,
  getTags,
  getTools,
} from "@/lib/cms/store";
import PostEditor from "@/components/PostEditor";
import { savePostAction } from "@/lib/cms/actions";

type Props = { params: Promise<{ slug: string }> };

export default async function EditPostPage({ params }: Props) {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const { slug } = await params;
  if (slug === "new") redirect("/admin/posts/new");
  const [post, categories, tags, tools] = await Promise.all([
    getPostBySlug(slug),
    getCategories(),
    getTags(),
    getTools(),
  ]);
  if (!post) notFound();
  return (
    <PostEditor
      post={post}
      categories={categories}
      tags={tags}
      tools={tools}
      onSubmit={savePostAction}
    />
  );
}
