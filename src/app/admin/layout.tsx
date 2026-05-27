import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  KeySquare,
  Wrench,
  FolderTree,
  LogOut,
  Plus,
  Code2,
} from "lucide-react";
import { isLoggedIn, logout } from "@/lib/cms/auth";

export const metadata = {
  title: "Admin: Insigtrade",
  robots: { index: false, follow: false },
};

const nav = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Posts", href: "/admin/posts", icon: FileText },
  { name: "Keywords", href: "/admin/keywords", icon: KeySquare },
  { name: "Tools", href: "/admin/tools", icon: Wrench },
  { name: "Categories", href: "/admin/categories", icon: FolderTree },
  { name: "Schemas", href: "/admin/schemas", icon: Code2 },
];

async function logoutAction() {
  "use server";
  await logout();
  redirect("/admin/login");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isLoggedIn();

  // Login page renders without sidebar even if not authed
  return (
    <div className="min-h-screen bg-slate-50">
      {authed ? (
        <div className="flex min-h-screen">
          <aside className="w-60 bg-navy text-white flex flex-col">
            <div className="p-6 border-b border-white/10">
              <Link href="/admin" className="text-lg font-bold">
                insig<span className="text-primary">trade</span>
                <span className="block text-xs font-normal text-white/40 mt-0.5">
                  Admin
                </span>
              </Link>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white rounded-md transition-colors"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Link>
              ))}
              <Link
                href="/admin/posts/new"
                className="mt-4 flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Post
              </Link>
            </nav>
            <div className="p-3 border-t border-white/10">
              <Link
                href="/"
                className="block text-xs text-white/40 hover:text-white px-3 py-1"
              >
                ← Back to site
              </Link>
              <form action={logoutAction}>
                <button className="mt-1 flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white rounded-md w-full">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </form>
            </div>
          </aside>
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      ) : (
        <main>{children}</main>
      )}
    </div>
  );
}
