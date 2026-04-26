import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/cms/auth";
import { getTools } from "@/lib/cms/store";
import { deleteToolAction, saveToolAction } from "@/lib/cms/actions";

export default async function AdminToolsPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const tools = await getTools();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy">Tools / Reviews</h1>
        <p className="text-sm text-muted">{tools.length} tool(s) in catalog</p>
      </header>

      <details className="bg-white border border-border rounded-xl p-4" open={tools.length === 0}>
        <summary className="cursor-pointer text-sm font-semibold text-navy">Add new tool</summary>
        <form action={saveToolAction} className="mt-4 grid sm:grid-cols-2 gap-3">
          <input name="name" className="input" placeholder="Tool name" required />
          <input name="slug" className="input" placeholder="slug (auto)" />
          <input name="tagline" className="input sm:col-span-2" placeholder="One-line tagline" />
          <textarea name="description" className="input sm:col-span-2" rows={3} placeholder="Description" />
          <input name="category" className="input" placeholder="Category" />
          <input name="pricing" className="input" placeholder="Pricing (e.g. Free / $29)" />
          <input name="rating" type="number" step="0.1" min="0" max="5" className="input" placeholder="Rating /5" />
          <input name="badge" className="input" placeholder="Badge (optional)" />
          <input name="website" className="input" placeholder="https://website" required />
          <input name="affiliateUrl" className="input" placeholder="Affiliate URL" />
          <textarea name="features" className="input sm:col-span-2" rows={3} placeholder="Features (one per line)" />
          <textarea name="pros" className="input" rows={3} placeholder="Pros (one per line)" />
          <textarea name="cons" className="input" rows={3} placeholder="Cons (one per line)" />
          <textarea name="useCases" className="input sm:col-span-2" rows={2} placeholder="Use cases (one per line)" />
          <textarea name="verdict" className="input sm:col-span-2" rows={2} placeholder="Verdict" />
          <button type="submit" className="sm:col-span-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-dark">
            Save Tool
          </button>
        </form>
      </details>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((t) => (
          <div key={t.id} className="bg-white border border-border rounded-xl p-5">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-navy">{t.name}</h3>
              {t.badge && <span className="text-xs px-2 py-0.5 bg-primary-light text-primary rounded-full">{t.badge}</span>}
            </div>
            <p className="text-xs text-muted mb-3 line-clamp-2">{t.tagline}</p>
            <div className="flex justify-between items-center text-xs text-muted">
              <span>★ {t.rating}</span>
              <span>{t.pricing}</span>
            </div>
            <form action={deleteToolAction} className="mt-3 text-right">
              <input type="hidden" name="id" value={t.id} />
              <button className="text-xs text-rose-500">delete</button>
            </form>
          </div>
        ))}
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; outline: none; }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
    </div>
  );
}
