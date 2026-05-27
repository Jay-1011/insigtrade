import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  Target,
  Users,
  BookOpen,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Insigtrade's mission to help traders leverage AI and automation for smarter decision-making in the financial markets.",
};

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy">
              About Insigtrade
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Helping traders navigate the AI revolution in finance, one tool,
              one guide, one strategy at a time.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-navy mb-6">Our Mission</h2>
          <div className="space-y-4 text-muted leading-relaxed">
            <p>
              The trading world is being transformed by artificial
              intelligence. From market analysis to sentiment tracking to
              automated execution, AI tools are giving traders capabilities
              that were once reserved for institutional firms.
            </p>
            <p>
              But with hundreds of tools flooding the market, it&apos;s hard
              to know which ones actually work, which are worth the
              investment, and how to integrate them into your workflow.
            </p>
            <p>
              <strong className="text-navy">
                That&apos;s where Insigtrade comes in.
              </strong>{" "}
              We test, review, and explain the best AI tools and automation
              strategies for traders. Our goal is simple: help you trade
              smarter, not harder.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-navy mb-8">What We Do</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "In-Depth Guides",
                description:
                  "We write practical, beginner-friendly guides that break down complex AI trading concepts into actionable steps.",
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: "Actionable Strategies",
                description:
                  "Every guide is built around concrete steps you can apply to your trading workflow today, no fluff, no hype.",
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: "Trading Systems",
                description:
                  "We help you build and optimize automated trading systems using the latest AI and no-code tools.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Community First",
                description:
                  "We're building a community of traders who share insights, strategies, and results as they adopt AI tools.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-surface rounded-xl p-6 border border-border"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-navy mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Creator Story */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-navy mb-6">The Story</h2>
          <div className="bg-surface rounded-xl border border-border p-8">
            <div className="space-y-4 text-muted leading-relaxed">
              <p>
                Insigtrade started from a simple frustration: spending hours
                on market research that could be done in minutes with the
                right tools.
              </p>
              <p>
                After discovering how AI tools could transform trading
                workflows, I started documenting everything, which tools
                worked, which didn&apos;t, and how to get the most out of
                them. That documentation became this website.
              </p>
              <p>
                Today, Insigtrade is a growing resource for traders who want
                to leverage AI without getting lost in the hype. Every
                article, review, and guide is written from real experience.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted mb-8">
            Explore our latest guides or check out the top AI tools for
            traders.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors"
            >
              Read the Blog
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-navy bg-surface hover:bg-surface-dark border border-border rounded-lg transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
