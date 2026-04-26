import type { Metadata } from "next";
import Link from "next/link";
import {
  Package,
  FileSpreadsheet,
  Workflow,
  BookOpen,
  Bell,
  ArrowRight,
} from "lucide-react";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Premium trading templates, automation systems, and digital products to supercharge your AI-powered trading workflow. Coming soon.",
};

const upcomingProducts = [
  {
    icon: <FileSpreadsheet className="w-7 h-7" />,
    title: "AI Trading Prompts Pack",
    description:
      "A curated library of 100+ ChatGPT prompts designed specifically for market research, stock screening, and trade analysis.",
    status: "Coming Soon",
  },
  {
    icon: <Workflow className="w-7 h-7" />,
    title: "Automated Research Workflows",
    description:
      "Pre-built automation templates that connect AI tools to your trading workflow — from news monitoring to position sizing.",
    status: "In Development",
  },
  {
    icon: <BookOpen className="w-7 h-7" />,
    title: "AI Trading Playbook",
    description:
      "A comprehensive guide to building your AI-powered trading system from scratch, with step-by-step walkthroughs.",
    status: "Coming Soon",
  },
  {
    icon: <Package className="w-7 h-7" />,
    title: "Starter Toolkit Bundle",
    description:
      "Everything you need to get started: templates, checklists, tool setup guides, and a private community invite.",
    status: "Planned",
  },
];

export default function ProductsPage() {
  return (
    <>
      {/* Header */}
      <section className="bg-surface border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy">
              Products
            </h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              Premium digital products to accelerate your AI-powered trading
              journey. Templates, playbooks, and automation systems —
              launching soon.
            </p>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid sm:grid-cols-2 gap-6">
          {upcomingProducts.map((product) => (
            <div
              key={product.title}
              className="bg-white rounded-2xl border border-border p-8 relative"
            >
              <span className="absolute top-6 right-6 inline-flex items-center px-2.5 py-0.5 text-xs font-semibold text-primary bg-primary-light rounded-full">
                {product.status}
              </span>
              <div className="w-14 h-14 rounded-xl bg-primary-light flex items-center justify-center text-primary mb-5">
                {product.icon}
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">
                {product.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {product.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Notify CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-navy rounded-2xl p-10 sm:p-14 text-white text-center">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-6">
            <Bell className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Be the First to Know
          </h2>
          <p className="text-lg text-white/60 max-w-xl mx-auto mb-8">
            Sign up for early access to our products and get exclusive launch
            discounts.
          </p>
          <NewsletterForm variant="dark" />
          <p className="mt-4 text-sm text-white/40">
            No spam. Just product launch updates.
          </p>
        </div>
      </section>

      {/* Free Resources */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold text-navy mb-6">
          Free Resources in the Meantime
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <Link
            href="/blog"
            className="group bg-surface rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-navy mb-2 group-hover:text-primary transition-colors">
              Read the Blog
            </h3>
            <p className="text-sm text-muted mb-3">
              In-depth guides on AI trading tools and automation strategies.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Browse Articles <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
          <Link
            href="/about"
            className="group bg-surface rounded-xl border border-border p-6 hover:border-primary/30 hover:shadow-md transition-all"
          >
            <h3 className="font-bold text-navy mb-2 group-hover:text-primary transition-colors">
              About Insigtrade
            </h3>
            <p className="text-sm text-muted mb-3">
              Learn about our mission and how we help traders leverage AI.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
              Read More <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
