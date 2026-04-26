import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/cms/auth";
import { getSchemaConfig } from "@/lib/cms/store";
import { saveSchemaConfigAction } from "@/lib/cms/actions";
import {
  organizationSchema,
  websiteSchema,
} from "@/lib/schema/jsonld";

export default async function AdminSchemasPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");
  const cfg = await getSchemaConfig();

  // Live previews
  const orgPreview = organizationSchema(cfg);
  const sitePreview = websiteSchema(cfg);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy">Schema Management</h1>
        <p className="text-sm text-muted">
          Global JSON-LD defaults. These power Organization, WebSite, and
          publisher fields across the entire site.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        <form action={saveSchemaConfigAction} className="space-y-6">
          {/* Organization */}
          <section className="bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-navy uppercase tracking-wide mb-4">
              Organization
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Name">
                <input name="orgName" defaultValue={cfg.organization.name} className="input" required />
              </Field>
              <Field label="Legal name">
                <input name="orgLegal" defaultValue={cfg.organization.legalName ?? ""} className="input" />
              </Field>
              <Field label="Logo URL (relative or absolute)">
                <input name="orgLogo" defaultValue={cfg.organization.logo ?? ""} className="input" placeholder="/logo.png" />
              </Field>
              <Field label="Founding date">
                <input name="orgFounded" defaultValue={cfg.organization.foundingDate ?? ""} className="input" placeholder="2026" />
              </Field>
              <Field label="Contact email">
                <input name="orgEmail" defaultValue={cfg.organization.contactPoint?.email ?? ""} className="input" />
              </Field>
              <Field label="Contact phone">
                <input name="orgPhone" defaultValue={cfg.organization.contactPoint?.telephone ?? ""} className="input" />
              </Field>
              <Field label="Contact type">
                <input name="orgContactType" defaultValue={cfg.organization.contactPoint?.contactType ?? "customer support"} className="input" />
              </Field>
            </div>
            <Field label="Social profiles (sameAs — one URL per line)" className="mt-3">
              <textarea
                name="orgSameAs"
                defaultValue={cfg.organization.sameAs.join("\n")}
                rows={4}
                className="input"
                placeholder="https://twitter.com/insigtrade&#10;https://linkedin.com/company/insigtrade"
              />
            </Field>
          </section>

          {/* WebSite */}
          <section className="bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-navy uppercase tracking-wide mb-4">
              WebSite
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Site name">
                <input name="siteName" defaultValue={cfg.website.name} className="input" required />
              </Field>
              <Field label="Language">
                <input name="siteLanguage" defaultValue={cfg.website.inLanguage} className="input" placeholder="en-US" />
              </Field>
            </div>
            <Field label="Description" className="mt-3">
              <textarea name="siteDescription" defaultValue={cfg.website.description} rows={3} className="input" required />
            </Field>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="siteSearch" defaultChecked={cfg.website.enableSearchAction} />
              Enable SearchAction (Google Sitelinks searchbox)
            </label>
          </section>

          {/* Default author */}
          <section className="bg-white border border-border rounded-xl p-5">
            <h2 className="text-sm font-bold text-navy uppercase tracking-wide mb-4">
              Default Author
            </h2>
            <p className="text-xs text-muted mb-3">
              Used when a post has no author assigned.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Author name">
                <input name="authorName" defaultValue={cfg.defaultAuthor?.name ?? ""} className="input" />
              </Field>
              <Field label="Author URL">
                <input name="authorUrl" defaultValue={cfg.defaultAuthor?.url ?? ""} className="input" />
              </Field>
            </div>
          </section>

          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg"
          >
            Save Schema Config
          </button>
        </form>

        {/* Live preview */}
        <aside className="space-y-4">
          <div className="bg-navy text-white rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
              Live Preview · Organization
            </p>
            <pre className="text-[10px] leading-snug overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(orgPreview, null, 2)}
            </pre>
          </div>
          <div className="bg-navy text-white rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
              Live Preview · WebSite
            </p>
            <pre className="text-[10px] leading-snug overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(sitePreview, null, 2)}
            </pre>
          </div>
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-navy mb-2">What this controls</p>
            <ul className="text-xs text-muted space-y-1">
              <li>• Publisher fields on every <code>BlogPosting</code></li>
              <li>• Site-wide <code>Organization</code> + <code>WebSite</code> JSON-LD</li>
              <li>• Default author when posts don&apos;t link one</li>
              <li>• Search action (sitelinks searchbox in Google)</li>
            </ul>
          </div>
        </aside>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; outline: none; }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
