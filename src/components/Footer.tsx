import Link from "next/link";
import { TrendingUp } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

const footerLinks = {
  Explore: [
    { name: "Blog", href: "/blog" },
    { name: "Tool Reviews", href: "/reviews" },
    { name: "Products", href: "/products" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
  Categories: [
    { name: "AI Tools", href: "/blog?category=ai-tools" },
    { name: "Automation", href: "/blog?category=automation" },
    { name: "Trading Systems", href: "/blog?category=trading-systems" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-navy text-white">
      {/* Newsletter band */}
      <div className="border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-2">
              Stay Ahead of the Market
            </h3>
            <p className="text-white/60 mb-6">
              Get weekly insights on the best AI tools, trading strategies, and
              automation tips. Free, no spam.
            </p>
            <NewsletterForm variant="dark" />
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                insig<span className="text-primary">trade</span>
              </span>
            </Link>
            <p className="text-sm text-white/50 leading-relaxed">
              Helping traders leverage AI and automation to make smarter
              decisions in the markets.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Insigtrade. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
