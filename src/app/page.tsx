import Link from "next/link";
import {
  ArrowRight,
  Star,
  Zap,
  BarChart3,
  BookOpen,
  Workflow,
  LineChart,
  Brain,
  ChevronRight,
  ShieldCheck,
  Clock,
  Target,
} from "lucide-react";
import {
  getCategories,
  getPublishedPosts,
  getSchemaConfig,
  getTestimonials,
  getTools,
} from "@/lib/cms/store";
import NewsletterForm from "@/components/NewsletterForm";
import { organizationSchema, websiteSchema } from "@/lib/schema/jsonld";

const topicIcons: Record<string, React.ReactNode> = {
  "ai-for-traders": <Brain className="w-6 h-6" />,
  "trading-automation": <Workflow className="w-6 h-6" />,
  "trader-productivity": <LineChart className="w-6 h-6" />,
  "market-research": <BarChart3 className="w-6 h-6" />,
  "wealth-systems": <Target className="w-6 h-6" />,
};

const benefits = [
  { icon: <Clock className="w-6 h-6" />, title: "Save Hours of Research", body: "AI scans thousands of stocks, news and data points in seconds — work that took you hours." },
  { icon: <Brain className="w-6 h-6" />, title: "Remove Emotional Bias", body: "Automated systems run your strategy consistently — without fear or greed in the loop." },
  { icon: <Target className="w-6 h-6" />, title: "Spot Opportunities Faster", body: "Pattern recognition and sentiment AI surface set-ups before the crowd notices." },
  { icon: <ShieldCheck className="w-6 h-6" />, title: "Manage Risk Smarter", body: "AI-powered position sizing and drawdown alerts protect your capital in volatile tape." },
];

export const revalidate = 600;

export default async function HomePage() {
  const [posts, categories, tools, testimonials, schemaCfg] = await Promise.all([
    getPublishedPosts(),
    getCategories(),
    getTools(),
    getTestimonials(),
    getSchemaConfig(),
  ]);

  const featuredPosts = posts.slice(0, 3);
  const trendingPosts = posts.slice(3, 6);
  const featuredTools = tools.slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema(schemaCfg)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema(schemaCfg)) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface to-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.06),transparent_50%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-sm font-medium text-primary bg-primary-light rounded-full">
              <Zap className="w-3.5 h-3.5" />
              AI-Powered Trading Intelligence
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight tracking-tight">
              Use AI & Automation to{" "}
              <span className="text-primary">Trade Smarter</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-muted leading-relaxed max-w-2xl mx-auto">
              Practical guides, tested tools, and automation playbooks for
              modern traders. Trusted by independent investors who want fewer
              hours behind the screen and better decisions in the market.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-colors shadow-lg shadow-primary/25"
              >
                <BookOpen className="w-5 h-5" />
                Read the Blog
              </Link>
              <Link
                href="/reviews"
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-navy bg-white hover:bg-surface border border-border rounded-xl transition-colors"
              >
                <Star className="w-5 h-5" />
                Tool Reviews
              </Link>
            </div>
            <div className="mt-10 flex items-center justify-center gap-8 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Trusted by 5,000+ traders
              </span>
              <span className="hidden sm:flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-accent" /> Updated weekly
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured guides */}
      {featuredPosts.length > 0 && (
        <section className="py-20 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-navy">Featured Guides</h2>
                <p className="mt-3 text-muted">Cornerstone reads for serious self-directed traders.</p>
              </div>
              <Link href="/blog" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary">
                All articles <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredPosts.map((post) => (
                <article key={post.slug} className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <BarChart3 className="w-12 h-12 text-primary/40" />
                  </div>
                  <div className="p-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-primary bg-primary-light rounded-full">
                      {post.format.replace("-", " ")}
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-navy group-hover:text-primary transition-colors leading-snug">
                      <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured tools */}
      {featuredTools.length > 0 && (
        <section className="py-20 sm:py-24 bg-surface">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy">Tools We Recommend</h2>
              <p className="mt-3 text-lg text-muted max-w-2xl mx-auto">
                Hand-tested AI and automation tools that deliver measurable
                value — not hype.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <div key={tool.id} className="group relative bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                  {tool.badge && (
                    <span className="absolute top-4 right-4 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary-light rounded-full">
                      {tool.badge}
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold mb-4">
                    {tool.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-1">{tool.name}</h3>
                  <p className="text-sm text-muted mb-4 line-clamp-2">{tool.tagline}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-semibold text-navy">{tool.rating}</span>
                    </div>
                    <span className="text-sm text-muted">{tool.pricing}</span>
                  </div>
                  <Link
                    href={`/reviews/${tool.slug}`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
                  >
                    Read review <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Topics */}
      {categories.length > 0 && (
        <section className="py-20 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy">Topics We Cover</h2>
              <p className="mt-3 text-lg text-muted max-w-2xl mx-auto">
                Five core clusters — built to take you from beginner to systems-driven trader.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className="group p-6 rounded-2xl border border-border bg-white hover:shadow-lg hover:border-primary/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                    {topicIcons[cat.slug] ?? <BookOpen className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-2">{cat.name}</h3>
                  <p className="text-sm text-muted leading-relaxed mb-4">{cat.description}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Browse cluster <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits */}
      <section className="py-20 sm:py-24 bg-surface">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-navy">Why AI Changes the Game</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-6 border border-border">
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                  {b.icon}
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">{b.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending */}
      {trendingPosts.length > 0 && (
        <section className="py-20 sm:py-24 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-navy">Trending Now</h2>
              <Link href="/blog" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-primary">
                See more <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {trendingPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group p-5 rounded-2xl border border-border hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {post.format.replace("-", " ")}
                  </span>
                  <h3 className="mt-2 font-bold text-navy text-base leading-snug group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted line-clamp-2">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-20 sm:py-24 bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl sm:text-4xl font-bold text-navy mb-12">
              What Readers Say
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {testimonials.slice(0, 4).map((t) => (
                <div key={t.id} className="p-6 bg-white rounded-2xl border border-border">
                  <p className="text-base italic text-slate-700">&ldquo;{t.quote}&rdquo;</p>
                  <p className="mt-4 text-sm font-semibold text-navy">
                    — {t.author}
                    {t.role && <span className="text-muted font-normal">, {t.role}</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-20 sm:py-24 bg-navy text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to Trade Smarter?</h2>
          <p className="mt-4 text-lg text-white/60 leading-relaxed">
            Join thousands of traders getting weekly automation tips and market insights — completely free.
          </p>
          <div className="mt-8">
            <NewsletterForm variant="dark" />
          </div>
          <p className="mt-4 text-sm text-white/40">No spam. Unsubscribe anytime.</p>
        </div>
      </section>
    </>
  );
}
