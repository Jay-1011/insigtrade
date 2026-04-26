import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/cms/auth";
import { getCategories, getKeywords } from "@/lib/cms/store";
import KeywordsClient from "@/components/admin/KeywordsClient";

type Search = { imported?: string; skipped?: string };

export default async function KeywordsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const [keywords, categories, sp] = await Promise.all([
    getKeywords(),
    getCategories(),
    searchParams,
  ]);

  const banner =
    sp.imported || sp.skipped
      ? `Imported ${sp.imported ?? 0} keyword(s)${sp.skipped ? ` — skipped ${sp.skipped} duplicate(s)` : ""}.`
      : null;

  return (
    <>
      {banner && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-lg">
          ✓ {banner}
        </div>
      )}
      <KeywordsClient
        keywords={keywords}
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      />
    </>
  );
}
