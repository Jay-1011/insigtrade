// Single source of truth for site-wide SEO defaults.
// Override per-environment with NEXT_PUBLIC_SITE_URL.

export const site = {
  name: "Insigtrade",
  tagline: "AI & Automation for Smarter Trading",
  description:
    "Insigtrade helps traders, finance enthusiasts and investors leverage AI tools, automation systems and modern workflows to make smarter decisions in the markets.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://insigtrade.com",
  twitter: "@insigtrade",
  defaultOgImage: "/og-default.png",
  organization: {
    name: "Insigtrade",
    legalName: "Insigtrade Media",
    sameAs: [
      "https://twitter.com/insigtrade",
      "https://www.linkedin.com/company/insigtrade",
    ],
    foundingDate: "2026",
    founder: "Insigtrade Team",
  },
} as const;

export const absoluteUrl = (p = "/") =>
  new URL(p, site.url).toString().replace(/\/$/, p === "/" ? "/" : "");
