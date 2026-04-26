import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/cms/auth";
import { getCategories, getTags, getTools } from "@/lib/cms/store";
import PostEditor from "@/components/PostEditor";
import { savePostAction } from "@/lib/cms/actions";

export default async function NewPostPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const [categories, tags, tools] = await Promise.all([
    getCategories(),
    getTags(),
    getTools(),
  ]);
  return (
    <PostEditor
      categories={categories}
      tags={tags}
      tools={tools}
      onSubmit={savePostAction}
    />
  );
}
