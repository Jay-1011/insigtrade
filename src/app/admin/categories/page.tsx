import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/cms/auth";
import { getCategories } from "@/lib/cms/store";
import { deleteCategoryAction, saveCategoryAction } from "@/lib/cms/actions";

export default async function AdminCategoriesPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const cats = await getCategories();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy">Categories</h1>
      </header>

      <form action={saveCategoryAction} className="bg-white border border-border rounded-xl p-4 space-y-3">
        <p className="text-sm font-semibold text-navy">Add / update category</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input name="name" className="input" placeholder="Name" required />
          <input name="slug" className="input" placeholder="slug (auto)" />
        </div>
        <textarea name="description" className="input" rows={2} placeholder="Public description" required />
        <input name="seoTitle" className="input" placeholder="SEO title (optional)" />
        <textarea name="seoDescription" className="input" rows={2} placeholder="SEO meta description (optional)" />
        <input name="pillarPostSlug" className="input" placeholder="Pillar post slug (optional)" />
        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">
          Save Category
        </button>
      </form>

      <div className="bg-white border border-border rounded-xl divide-y divide-border">
        {cats.length === 0 ? (
          <p className="p-6 text-muted text-sm">No categories yet.</p>
        ) : (
          cats.map((c) => (
            <div key={c.slug} className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-navy">{c.name}</p>
                <p className="text-xs text-muted">{c.slug}, {c.description}</p>
              </div>
              <form action={deleteCategoryAction}>
                <input type="hidden" name="slug" value={c.slug} />
                <button className="text-xs text-rose-500">delete</button>
              </form>
            </div>
          ))
        )}
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; outline: none; }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
    </div>
  );
}
