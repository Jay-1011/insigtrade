import Link from "next/link";
import { redirect } from "next/navigation";
import { Edit2, ExternalLink, Plus } from "lucide-react";
import { isLoggedIn } from "@/lib/cms/auth";
import { getAllPosts } from "@/lib/cms/store";
import { deletePostAction } from "@/lib/cms/actions";

const statusStyles: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-violet-50 text-violet-700",
};

export default async function AdminPostsPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const posts = await getAllPosts();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Posts</h1>
          <p className="text-sm text-muted">{posts.length} total</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg"
        >
          <Plus className="w-4 h-4" /> New Post
        </Link>
      </header>

      {posts.length === 0 ? (
        <div className="p-10 bg-white border border-dashed border-border rounded-xl text-center">
          <p className="text-muted">No posts yet.</p>
          <Link href="/admin/posts/new" className="mt-3 inline-block text-sm text-primary font-semibold">
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Format</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Updated</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts.map((p) => (
                <tr key={p.slug} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${p.slug}`} className="font-semibold text-navy hover:text-primary">
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted truncate max-w-md">{p.excerpt}</p>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">{p.format}</td>
                  <td className="px-4 py-3 text-muted text-xs">{p.categorySlug || "-"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyles[p.status] ?? "bg-slate-100"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-xs">
                    {new Date(p.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {p.status === "published" && (
                        <Link href={`/blog/${p.slug}`} target="_blank" className="text-muted hover:text-primary" title="View">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      <Link href={`/admin/posts/${p.slug}`} className="text-muted hover:text-primary" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <form action={deletePostAction} className="inline">
                        <input type="hidden" name="slug" value={p.slug} />
                        <button
                          type="submit"
                          className="text-rose-500 hover:text-rose-700 text-xs"
                          // eslint-disable-next-line react/no-unknown-property
                          formNoValidate
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
