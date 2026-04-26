import Link from "next/link";
import { redirect } from "next/navigation";
import {
  FileText,
  Calendar as CalIcon,
  CheckCircle,
  AlertTriangle,
  KeySquare,
  Wrench,
  FolderTree,
  TrendingUp,
} from "lucide-react";
import { isLoggedIn } from "@/lib/cms/auth";
import { getAllPosts, getDashboardStats } from "@/lib/cms/store";
import { validatePostSchemas } from "@/lib/schema/jsonld";

export default async function AdminDashboard() {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const stats = await getDashboardStats();
  const posts = await getAllPosts();
  const schemaWarnings = posts
    .map((p) => ({ post: p, warnings: validatePostSchemas(p) }))
    .filter((x) => x.warnings.length > 0)
    .slice(0, 6);

  const cards = [
    { label: "Total Posts", value: stats.posts, icon: FileText, color: "bg-blue-50 text-blue-600" },
    { label: "Published", value: stats.published, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600" },
    { label: "Drafts", value: stats.drafts, icon: FileText, color: "bg-slate-100 text-slate-600" },
    { label: "Scheduled", value: stats.scheduled, icon: CalIcon, color: "bg-violet-50 text-violet-600" },
    { label: "Categories", value: stats.categories, icon: FolderTree, color: "bg-indigo-50 text-indigo-600" },
    { label: "Tags", value: stats.tags, icon: TrendingUp, color: "bg-pink-50 text-pink-600" },
    { label: "Tools", value: stats.tools, icon: Wrench, color: "bg-amber-50 text-amber-600" },
    { label: "Keywords Planned", value: stats.keywords, icon: KeySquare, color: "bg-teal-50 text-teal-600" },
  ];

  const issues = [
    { label: "Posts missing meta title/description", value: stats.issues.missingMeta },
    { label: "Posts missing FAQ section", value: stats.issues.missingFaq },
    { label: "Posts missing featured image", value: stats.issues.missingFeaturedImage },
    { label: "Posts missing focus keyword", value: stats.issues.missingFocusKeyword },
  ];

  const kw = stats.keywordsByStatus;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
        <p className="text-sm text-muted">Welcome back. Here&apos;s your content snapshot.</p>
      </header>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="p-5 bg-white border border-border rounded-xl">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.color} mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-navy">{c.value}</p>
            <p className="text-xs text-muted mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {/* SEO Health */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4">SEO Health</h2>
        <div className="bg-white border border-border rounded-xl divide-y divide-border">
          {issues.map((i) => (
            <div key={i.label} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {i.value > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )}
                <span className="text-sm text-slate-700">{i.label}</span>
              </div>
              <span className={`text-sm font-semibold ${i.value > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {i.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Keyword pipeline */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">Keyword Pipeline</h2>
          <Link href="/admin/keywords" className="text-xs font-semibold text-primary">
            Manage →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Ideas", value: kw.idea, color: "bg-slate-100" },
            { label: "Writing", value: kw.writing, color: "bg-blue-100" },
            { label: "Published", value: kw.published, color: "bg-emerald-100" },
            { label: "Need Update", value: kw.update, color: "bg-amber-100" },
          ].map((k) => (
            <div key={k.label} className={`p-4 rounded-xl ${k.color}`}>
              <p className="text-2xl font-bold text-navy">{k.value}</p>
              <p className="text-xs text-slate-700 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Schema validation warnings */}
      {schemaWarnings.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy">Schema Warnings</h2>
            <Link href="/admin/schemas" className="text-xs font-semibold text-primary">
              Manage schemas →
            </Link>
          </div>
          <div className="bg-white border border-border rounded-xl divide-y divide-border">
            {schemaWarnings.map(({ post, warnings }) => (
              <div key={post.slug} className="p-4">
                <Link href={`/admin/posts/${post.slug}`} className="font-semibold text-navy hover:text-primary text-sm">
                  {post.title}
                </Link>
                <ul className="mt-1 space-y-0.5">
                  {warnings.map((w, i) => (
                    <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                      <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-lg font-bold text-navy mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/admin/posts/new" className="p-5 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all">
            <p className="font-semibold text-navy">+ Create New Post</p>
            <p className="text-xs text-muted mt-1">Start drafting an article from scratch.</p>
          </Link>
          <Link href="/admin/keywords" className="p-5 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all">
            <p className="font-semibold text-navy">Open Keyword Planner</p>
            <p className="text-xs text-muted mt-1">Plan, track and prioritize content.</p>
          </Link>
          <Link href="/admin/tools" className="p-5 bg-white border border-border rounded-xl hover:border-primary/30 hover:shadow-md transition-all">
            <p className="font-semibold text-navy">Manage Tool Reviews</p>
            <p className="text-xs text-muted mt-1">Add affiliate-ready tool entries.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
