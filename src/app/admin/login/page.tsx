import { redirect } from "next/navigation";
import { isLoggedIn, login } from "@/lib/cms/auth";

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/admin");

  async function loginAction(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    const ok = await login(password);
    if (ok) redirect("/admin");
    redirect("/admin/login?error=1");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-navy">
            insig<span className="text-primary">trade</span> admin
          </h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage content</p>
        </div>
        <form
          action={loginAction}
          className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4"
        >
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy mb-1"
            >
              Admin Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Enter admin password"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
          >
            Sign In
          </button>
          <p className="text-xs text-center text-muted">
            Default password: <code className="bg-surface px-1.5 py-0.5 rounded">insigtrade-admin-2026</code>
            <br />
            Set <code>ADMIN_PASSWORD</code> env to override.
          </p>
        </form>
      </div>
    </div>
  );
}
