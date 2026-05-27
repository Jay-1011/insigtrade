"use client";

import { useState, useTransition } from "react";
import {
  Sparkles,
  Wand2,
  Loader2,
  X,
  Calendar,
  FileText,
  Upload,
} from "lucide-react";
import type { Keyword } from "@/lib/cms/types";
import {
  bulkImportKeywordsAction,
  deleteKeywordAction,
  generateBlogForKeywordAction,
  persistSuggestedKeywordsAction,
  saveKeywordAction,
  suggestKeywordsAction,
  type SuggestKeywordsResult,
} from "@/lib/cms/actions";
import type { SuggestedKeyword } from "@/lib/ai/claude";

const statusColor: Record<string, string> = {
  idea: "bg-slate-100 text-slate-700",
  writing: "bg-blue-100 text-blue-700",
  published: "bg-emerald-100 text-emerald-700",
  update: "bg-amber-100 text-amber-700",
};

interface Props {
  keywords: Keyword[];
  categories: { slug: string; name: string }[];
}

export default function KeywordsClient({ keywords, categories }: Props) {
  const [showSuggest, setShowSuggest] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Sort: priority + status
  const order = { high: 0, medium: 1, low: 2 } as const;
  const sorted = [...keywords].sort(
    (a, b) =>
      (order[a.priority ?? "medium"] ?? 1) - (order[b.priority ?? "medium"] ?? 1) ||
      a.keyword.localeCompare(b.keyword)
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Keyword Planner</h1>
          <p className="text-sm text-muted">
            {keywords.length} entries. Import from Semrush, suggest with Claude,
            or add manually.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-navy bg-white border border-border hover:border-primary/50 rounded-lg"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowSuggest(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Suggest with Claude
          </button>
        </div>
      </header>

      {/* Quick add (manual) */}
      <details className="bg-white border border-border rounded-xl">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-navy">
          Add keyword manually
        </summary>
        <form action={saveKeywordAction} className="px-4 pb-4 grid sm:grid-cols-6 gap-2">
          <input name="keyword" required className="input sm:col-span-2" placeholder="keyword" />
          <input name="volume" type="number" className="input" placeholder="vol" />
          <input name="difficulty" type="number" className="input" placeholder="KD" />
          <select name="intent" className="input" defaultValue="">
            <option value="">intent</option>
            {["informational", "commercial", "comparison", "transactional", "navigational"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="priority" className="input" defaultValue="medium">
            <option>high</option><option>medium</option><option>low</option>
          </select>
          <select name="cluster" className="input" defaultValue="">
            <option value="">cluster</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select name="funnelStage" className="input" defaultValue="">
            <option value="">funnel</option>
            {["TOFU", "MOFU", "BOFU"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="monetization" className="input" defaultValue="">
            <option value="">monetization</option>
            {["affiliate", "adsense", "product", "newsletter", "none"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <select name="status" className="input" defaultValue="idea">
            {["idea", "writing", "published", "update"].map((v) => <option key={v}>{v}</option>)}
          </select>
          <input name="suggestedTitle" className="input sm:col-span-2" placeholder="suggested title" />
          <button type="submit" className="sm:col-span-6 px-4 py-2 text-sm font-semibold text-white bg-navy rounded-lg hover:bg-navy-light">
            Add Keyword
          </button>
        </form>
      </details>

      {/* Table */}
      {sorted.length === 0 ? (
        <p className="text-muted text-sm">
          No keywords yet. Click <strong>Suggest with Claude</strong> to get
          started in 30 seconds.
        </p>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-600 tracking-wider">
              <tr>
                <th className="text-left px-3 py-2">Keyword</th>
                <th className="text-left px-3 py-2">Vol</th>
                <th className="text-left px-3 py-2">KD</th>
                <th className="text-left px-3 py-2">Intent</th>
                <th className="text-left px-3 py-2">Cluster</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-right px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((k) => (
                <KeywordRow key={k.id} k={k} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSuggest && (
        <SuggestModal
          categories={categories}
          onClose={() => setShowSuggest(false)}
        />
      )}
      {showImport && (
        <ImportModal
          categories={categories}
          onClose={() => setShowImport(false)}
        />
      )}

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; outline: none; }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Per-row component: status badge + Generate Blog button
// ──────────────────────────────────────────────────────────

function KeywordRow({ k }: { k: Keyword }) {
  const [pending, startTransition] = useTransition();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");

  const handleGenerate = (status: "draft" | "scheduled") => {
    const fd = new FormData();
    fd.append("keywordId", k.id);
    fd.append("status", status);
    if (status === "scheduled" && scheduledFor) {
      fd.append("scheduledFor", new Date(scheduledFor).toISOString());
    }
    startTransition(() => {
      generateBlogForKeywordAction(fd);
    });
  };

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-3 py-2">
        <p className="font-semibold text-navy">{k.keyword}</p>
        {k.suggestedTitle && (
          <p className="text-xs text-muted">{k.suggestedTitle}</p>
        )}
        {k.linkedPostSlug && (
          <p className="text-xs text-primary mt-0.5">→ /blog/{k.linkedPostSlug}</p>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-muted">{k.volume ?? "-"}</td>
      <td className="px-3 py-2 text-xs text-muted">{k.difficulty ?? "-"}</td>
      <td className="px-3 py-2 text-xs text-muted">{k.intent ?? "-"}</td>
      <td className="px-3 py-2 text-xs text-muted">{k.cluster ?? "-"}</td>
      <td className="px-3 py-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[k.status]}`}>
          {k.status}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center justify-end gap-2">
          {k.status === "idea" && (
            <>
              {showSchedule ? (
                <>
                  <input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="px-2 py-1 text-xs border border-border rounded-md"
                  />
                  <button
                    onClick={() => handleGenerate("scheduled")}
                    disabled={pending || !scheduledFor}
                    className="px-2 py-1 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-md disabled:opacity-40"
                  >
                    {pending ? "..." : "Schedule"}
                  </button>
                  <button
                    onClick={() => setShowSchedule(false)}
                    className="text-xs text-muted"
                  >
                    cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleGenerate("draft")}
                    disabled={pending}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-md disabled:opacity-50"
                    title="Generate full blog post via Claude (saves as draft)"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Generating…
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        Generate Blog
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSchedule(true)}
                    disabled={pending}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-violet-600 disabled:opacity-40"
                    title="Generate and schedule for future publish"
                  >
                    <Calendar className="w-3 h-3" />
                  </button>
                </>
              )}
            </>
          )}
          {k.linkedPostSlug && (
            <a
              href={`/admin/posts/${k.linkedPostSlug}`}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              title="Edit linked post"
            >
              <FileText className="w-3 h-3" />
              edit
            </a>
          )}
          <form action={deleteKeywordAction} className="inline">
            <input type="hidden" name="id" value={k.id} />
            <button className="text-xs text-rose-500">delete</button>
          </form>
        </div>
      </td>
    </tr>
  );
}

// ──────────────────────────────────────────────────────────
// Modal: Suggest with Claude
// ──────────────────────────────────────────────────────────

function SuggestModal({
  categories,
  onClose,
}: {
  categories: { slug: string; name: string }[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SuggestKeywordsResult | null>(null);
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await suggestKeywordsAction(fd);
      setResult(res);
      if (res.ok && res.keywords) {
        setPicked(new Set(res.keywords.map((_, i) => i)));
      }
    });
  };

  const persist = () => {
    if (!result?.keywords) return;
    const chosen = result.keywords.filter((_, i) => picked.has(i));
    if (chosen.length === 0) return;
    const fd = new FormData();
    fd.append("suggestions", JSON.stringify(chosen));
    startTransition(() => {
      persistSuggestedKeywordsAction(fd);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-navy">Suggest keywords with Claude</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-4">
          {!result?.keywords && (
            <form onSubmit={onSubmit} className="space-y-3">
              <Field label="Seed topic">
                <input
                  name="seed"
                  required
                  autoFocus
                  className="input"
                  placeholder='e.g. "ChatGPT for options trading" or "Notion for traders"'
                />
              </Field>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Cluster (optional)">
                  <select name="cluster" className="input" defaultValue="">
                    <option value="">- any -</option>
                    {categories.map((c) => (
                      <option key={c.slug} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Preferred intent (optional)">
                  <select name="intent" className="input" defaultValue="">
                    <option value="">- any -</option>
                    {["informational", "commercial", "comparison", "transactional"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </Field>
                <Field label="How many?">
                  <input name="count" type="number" defaultValue={10} min={1} max={20} className="input" />
                </Field>
              </div>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Asking Claude…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Get suggestions
                  </>
                )}
              </button>
              <p className="text-xs text-muted">
                Claude (Opus 4.7) will research the topic considering your existing
                pipeline. Avg 15-30s.
              </p>
            </form>
          )}

          {result && !result.ok && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-800">
              <p className="font-semibold">Error</p>
              <p className="mt-1">{result.error}</p>
              <button
                onClick={() => setResult(null)}
                className="mt-3 text-xs text-rose-700 underline"
              >
                Try again
              </button>
            </div>
          )}

          {result?.ok && result.keywords && (
            <>
              <p className="text-sm text-muted">
                Claude suggested <strong>{result.keywords.length}</strong> keywords.
                Uncheck any you don&apos;t want, then click <em>Add to planner</em>.
              </p>
              <div className="space-y-2">
                {result.keywords.map((k, i) => (
                  <label
                    key={i}
                    className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                      picked.has(i)
                        ? "border-primary bg-primary-light/30"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={picked.has(i)}
                        onChange={(e) => {
                          const next = new Set(picked);
                          if (e.target.checked) next.add(i);
                          else next.delete(i);
                          setPicked(next);
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-navy text-sm">
                          {k.keyword}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {k.suggestedTitle}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <Tag>vol ~{k.estimatedVolume}</Tag>
                          <Tag>KD {k.estimatedDifficulty}</Tag>
                          <Tag>{k.intent}</Tag>
                          <Tag>{k.cluster}</Tag>
                          <Tag>{k.funnelStage}</Tag>
                          <Tag>${k.monetization}</Tag>
                        </div>
                        <p className="text-xs text-slate-600 italic mt-2">
                          {k.rationale}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2 sticky bottom-0 bg-white -mx-5 px-5 py-3 border-t border-border">
                <button
                  onClick={() => {
                    setResult(null);
                    setPicked(new Set());
                  }}
                  className="text-sm text-muted hover:text-navy"
                >
                  ← New search
                </button>
                <button
                  onClick={persist}
                  disabled={pending || picked.size === 0}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50"
                >
                  Add {picked.size} to planner
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; outline: none; }
        .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
// Modal: Bulk import from Semrush / Ahrefs / GSC CSV
// ──────────────────────────────────────────────────────────

function ImportModal({
  categories,
  onClose,
}: {
  categories: { slug: string; name: string }[];
  onClose: () => void;
}) {
  const [csv, setCsv] = useState("");
  const [defaultCluster, setDefaultCluster] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    bulkImportKeywordsAction(fd);
  };

  const previewRows = csv
    .trim()
    .split(/\r?\n/)
    .slice(0, 6); // header + 5 sample rows

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-navy">Bulk import keywords</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-navy">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="overflow-y-auto p-5 space-y-4"
        >
          <div className="bg-surface border border-border rounded-lg p-4 text-sm text-slate-700 space-y-2">
            <p className="font-semibold text-navy">How to export from Semrush</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Open Semrush → <strong>Keyword Magic Tool</strong></li>
              <li>Search a seed → filter by KD, intent, etc.</li>
              <li>Click <strong>Export</strong> → CSV (semicolon)</li>
              <li>Open the file, copy all rows, paste below</li>
            </ol>
            <p className="text-xs text-muted pt-1">
              Also works with Ahrefs Keywords Explorer, Google Search Console
              exports, or any CSV with a <code className="bg-white px-1 rounded">keyword</code> column.
              Auto-detects comma / tab / semicolon delimiters.
            </p>
          </div>

          <label className="block">
            <span className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
              Default cluster (optional)
            </span>
            <select
              name="defaultCluster"
              value={defaultCluster}
              onChange={(e) => setDefaultCluster(e.target.value)}
              className="input"
            >
              <option value="">- let CSV decide -</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted mt-1">
              If your CSV has no cluster/category column, all rows get assigned here.
            </p>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
              CSV / TSV paste
            </span>
            <textarea
              name="csv"
              required
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={12}
              placeholder={`keyword,volume,kd,intent\nhow to use chatgpt for stock trading,1300,18,informational\nbest ai tools for swing traders,480,22,commercial\n...`}
              className="input font-mono text-xs"
            />
            <p className="text-xs text-muted mt-1">
              Required column: <code>keyword</code>. Optional: <code>volume</code>, <code>kd</code>, <code>intent</code>, <code>cluster</code>.
            </p>
          </label>

          {previewRows.length > 1 && (
            <div className="text-xs">
              <p className="font-semibold text-navy mb-1">Preview (first 5 rows):</p>
              <div className="bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto">
                {previewRows.map((row, i) => (
                  <div key={i} className={i === 0 ? "font-bold text-primary" : ""}>
                    {row}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted hover:text-navy"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!csv.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50"
            >
              Import keywords
            </button>
          </div>
        </form>

        <style>{`.input { width: 100%; padding: 0.5rem 0.75rem; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 0.5rem; background: white; outline: none; }
          .input:focus { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }`}</style>
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-1.5 py-0.5 bg-surface text-slate-600 rounded font-mono">
      {children}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}
