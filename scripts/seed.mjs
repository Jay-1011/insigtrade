// node scripts/seed.mjs
// Seeds /content with starter categories, authors, tags, tools, keywords, and 3 sample posts.

import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = path.join(process.cwd(), "content");

const dirs = ["posts", "categories", "tags", "authors", "tools", "keywords", "testimonials"];

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}
async function write(rel, key, data) {
  const dir = path.join(ROOT, rel);
  await ensureDir(dir);
  await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(data, null, 2), "utf8");
}

const now = () => new Date().toISOString();

// ── Authors ────────────────────────────────────────────────
const authors = [
  {
    id: "team",
    name: "Insigtrade Team",
    slug: "team",
    role: "Editorial Team",
    bio: "We test AI tools, build automation workflows, and write the playbooks we wish we had when we started trading.",
  },
];

// ── Categories (5 clusters) ────────────────────────────────
const categories = [
  {
    slug: "ai-for-traders",
    name: "AI for Traders",
    description: "How to use AI tools to analyze markets, screen stocks and make smarter decisions.",
    seoTitle: "AI for Traders — Tools, Prompts & Strategies | Insigtrade",
    seoDescription: "Hands-on guides on using ChatGPT, Claude and AI tools for stock research, technical analysis and trading workflows.",
    faqs: [
      { q: "Can AI predict the stock market?", a: "No. AI is a research multiplier, not a crystal ball. It dramatically speeds up analysis but doesn't predict price." },
      { q: "Is ChatGPT good for trading?", a: "For research, idea generation and earnings prep — yes. For live signals — no. Use it as an analyst on call, not an oracle." },
    ],
  },
  {
    slug: "trading-automation",
    name: "Trading Automation",
    description: "No-code and low-code workflows that automate alerts, journaling, screening and execution.",
    seoTitle: "Trading Automation — No-Code Workflows for Traders",
    seoDescription: "Step-by-step automation guides using Zapier, Make.com, n8n and broker APIs for retail traders.",
  },
  {
    slug: "trader-productivity",
    name: "Trader Productivity",
    description: "Journals, templates and systems that help you trade with consistency and discipline.",
    seoTitle: "Trader Productivity — Journals, Templates & Workflows",
    seoDescription: "The best trading journals, Notion templates and productivity systems for self-directed traders.",
  },
  {
    slug: "market-research",
    name: "Market Research Systems",
    description: "Stock screeners, earnings prep and news workflows that find opportunities faster.",
    seoTitle: "Market Research Systems for Modern Traders",
    seoDescription: "Build an efficient stock research workflow using AI-powered screeners, news APIs and earnings tools.",
  },
  {
    slug: "wealth-systems",
    name: "Wealth Systems",
    description: "AI tools and digital systems for self-directed investors, side-hustlers and import-export operators.",
    seoTitle: "Wealth Systems — AI for Modern Money Workflows",
    seoDescription: "AI-powered productivity and finance tools for solopreneurs, traders and small business owners.",
  },
];

// ── Tags ───────────────────────────────────────────────────
const tags = [
  { slug: "chatgpt", name: "ChatGPT" },
  { slug: "claude", name: "Claude" },
  { slug: "no-code", name: "No-Code" },
  { slug: "automation", name: "Automation" },
  { slug: "options", name: "Options" },
  { slug: "swing-trading", name: "Swing Trading" },
  { slug: "tradingview", name: "TradingView" },
  { slug: "notion", name: "Notion" },
  { slug: "zapier", name: "Zapier" },
  { slug: "make", name: "Make.com" },
  { slug: "earnings", name: "Earnings" },
  { slug: "screeners", name: "Screeners" },
];

// ── Tools ──────────────────────────────────────────────────
const tools = [
  {
    id: "tradingview",
    slug: "tradingview",
    name: "TradingView",
    tagline: "The charting standard most traders default to.",
    description: "TradingView is a browser-based charting and social trading platform. Solid free tier; Pro plans unlock more indicators per chart, multi-monitor layouts and faster bar replay.",
    category: "Charting",
    website: "https://www.tradingview.com",
    affiliateUrl: "https://www.tradingview.com/?aff_id=insigtrade",
    pricing: "Free / from $14.95/mo",
    rating: 4.8,
    features: ["Cloud-based charts","100+ indicators","Pine Script","Webhook alerts","Multi-broker connect"],
    pros: ["Best charting UX","Huge community","Powerful alerts (Pro+)","Cross-device sync"],
    cons: ["Free tier ad-supported","Pine Script learning curve","Real-time data costs extra"],
    useCases: ["Daily charting","Alert-driven swing trading","Sharing setups socially"],
    verdict: "Still the default for most retail traders. The Pro plan pays back fast for anyone using webhook alerts.",
    badge: "Editor's Choice",
  },
  {
    id: "trendspider",
    slug: "trendspider",
    name: "TrendSpider",
    tagline: "AI-augmented charting with auto pattern detection.",
    description: "TrendSpider automatically draws trendlines, marks support/resistance and runs multi-timeframe analysis. Strong for swing traders who want AI overlays without writing code.",
    category: "Charting",
    website: "https://trendspider.com",
    affiliateUrl: "https://trendspider.com/?ref=insigtrade",
    pricing: "From $39/mo",
    rating: 4.6,
    features: ["Auto trendlines","Multi-timeframe analysis","Strategy backtesting","Smart alerts","Raindrop charts"],
    pros: ["Saves chart-prep time","No-code backtester","Strong scanner","Great mobile app"],
    cons: ["Higher learning curve","Pricing tiers can confuse"],
    useCases: ["Swing setup discovery","Backtesting price patterns","Multi-timeframe confluence"],
    verdict: "Excellent for swing traders who want AI-assisted analysis without leaving the chart.",
    badge: "Best for Swing",
  },
  {
    id: "tradervue",
    slug: "tradervue",
    name: "Tradervue",
    tagline: "The trading journal pros have used for over a decade.",
    description: "Tradervue imports trades from most brokers, lets you tag setups, attach charts and review performance by playbook. Battle-tested journaling without bloat.",
    category: "Journal",
    website: "https://www.tradervue.com",
    affiliateUrl: "https://www.tradervue.com/?ref=insigtrade",
    pricing: "Free / from $29/mo",
    rating: 4.5,
    features: ["Auto trade import","Tagging & playbooks","Performance analytics","Risk metrics","Sharing"],
    pros: ["Reliable import","Strong analytics","Long track record","Mobile friendly"],
    cons: ["UI dated in places","No native AI features yet"],
    useCases: ["Daily trade journaling","Playbook performance review","Mentor sharing"],
    verdict: "If you only buy one thing this quarter as a serious trader — make it a journal. Tradervue is the safe pick.",
  },
];

// ── Testimonials ──────────────────────────────────────────
const testimonials = [
  { id: "t1", quote: "Finally a finance blog that tests stuff instead of regurgitating press releases.", author: "Maya R.", role: "Swing trader" },
  { id: "t2", quote: "The Notion journal template alone saved me 3 hours a week. Subscribed.", author: "Daniel O.", role: "Options trader" },
  { id: "t3", quote: "Their ChatGPT prompt pack is the first thing I open every morning.", author: "Anika K.", role: "Independent investor" },
  { id: "t4", quote: "Refreshingly honest reviews — they actually flag tools that don't work.", author: "Marcus T.", role: "Day trader" },
];

// ── Keywords (subset of full 100, demonstrating system) ────
const keywordSeed = [
  { id: "k1", keyword: "how to use chatgpt for stock trading", volume: 1300, difficulty: 18, intent: "informational", cluster: "ai-for-traders", funnelStage: "TOFU", priority: "high", suggestedTitle: "How to Use ChatGPT for Stock Trading (2026 Guide)", monetization: "affiliate", status: "writing" },
  { id: "k2", keyword: "chatgpt prompts for traders", volume: 880, difficulty: 14, intent: "informational", cluster: "ai-for-traders", funnelStage: "TOFU", priority: "high", suggestedTitle: "50 ChatGPT Prompts Every Trader Should Bookmark", monetization: "newsletter", status: "published", linkedPostSlug: "chatgpt-prompts-for-traders" },
  { id: "k3", keyword: "best ai tools for swing traders", volume: 480, difficulty: 22, intent: "commercial", cluster: "ai-for-traders", funnelStage: "MOFU", priority: "high", suggestedTitle: "7 Best AI Tools for Swing Traders, Tested", monetization: "affiliate", status: "writing" },
  { id: "k4", keyword: "tradervue vs edgewonk", volume: 320, difficulty: 17, intent: "comparison", cluster: "trader-productivity", funnelStage: "BOFU", priority: "high", suggestedTitle: "Tradervue vs Edgewonk: Which Trading Journal Wins in 2026?", monetization: "affiliate", status: "idea" },
  { id: "k5", keyword: "notion template for traders", volume: 590, difficulty: 14, intent: "commercial", cluster: "trader-productivity", funnelStage: "MOFU", priority: "medium", suggestedTitle: "The Notion Trading Journal Template I Use Daily (Free)", monetization: "product", status: "idea" },
  { id: "k6", keyword: "tradingview webhook to broker", volume: 720, difficulty: 22, intent: "informational", cluster: "trading-automation", funnelStage: "MOFU", priority: "high", suggestedTitle: "TradingView Webhook → Broker: 4 Ways Compared", monetization: "affiliate", status: "idea" },
  { id: "k7", keyword: "perplexity for stock research", volume: 320, difficulty: 9, intent: "informational", cluster: "ai-for-traders", funnelStage: "TOFU", priority: "medium", suggestedTitle: "How to Use Perplexity for Earnings Research", monetization: "newsletter", status: "idea" },
  { id: "k8", keyword: "how to automate trading alerts to discord", volume: 880, difficulty: 16, intent: "informational", cluster: "trading-automation", funnelStage: "TOFU", priority: "high", suggestedTitle: "Automate Trade Alerts to Discord in 10 Minutes", monetization: "adsense", status: "idea" },
  { id: "k9", keyword: "ai for import export business", volume: 320, difficulty: 8, intent: "informational", cluster: "wealth-systems", funnelStage: "TOFU", priority: "medium", suggestedTitle: "AI for Import-Export Market Intelligence (Practical Guide)", monetization: "newsletter", status: "idea" },
  { id: "k10", keyword: "best trading journal software", volume: 1900, difficulty: 26, intent: "commercial", cluster: "trader-productivity", funnelStage: "MOFU", priority: "high", suggestedTitle: "Best Trading Journal Software in 2026 (Tested)", monetization: "affiliate", status: "idea" },
];

// ── Sample Posts ──────────────────────────────────────────
const ts = now();

const post1 = {
  id: "p1",
  slug: "chatgpt-prompts-for-traders",
  title: "50 ChatGPT Prompts Every Trader Should Bookmark",
  subtitle: "Tested prompts that turn ChatGPT into your research analyst.",
  excerpt: "A curated list of 50 ChatGPT prompts for stock research, technical analysis, earnings prep and trade journaling — copy-paste ready.",
  format: "guide",
  status: "published",
  publishedAt: ts,
  createdAt: ts,
  updatedAt: ts,
  authorId: "team",
  categorySlug: "ai-for-traders",
  tagSlugs: ["chatgpt", "swing-trading"],
  featuredImage: "",
  readTime: "9 min read",
  reviewToolId: "",
  blocks: [
    { type: "tldr", text: "Use these 50 prompts to cut your daily research time in half. Save them in a Notion page or as ChatGPT custom instructions." },
    { type: "paragraph", text: "ChatGPT isn't going to predict tomorrow's market. But used right, it's a tireless research analyst that turns hours of work into minutes — earnings prep, sector scans, idea validation, journaling reviews. The trick is having the right prompts ready." },
    { type: "key-takeaways", items: [
      "Specific prompts beat generic ones — always set role + context + output format.",
      "Use Custom GPTs to memorize your trading style and risk parameters.",
      "Pair ChatGPT with real data sources (don't trust it for prices).",
      "Save prompts that work — your library compounds in value.",
    ]},
    { type: "heading", level: 2, text: "How to use these prompts" },
    { type: "paragraph", text: "Each prompt below uses a simple R-C-O structure: Role, Context, Output. Replace the bracketed placeholders, then iterate." },
    { type: "callout", variant: "tip", title: "Pro tip", text: "Keep your prompts in Notion, then add a 'Run' link that opens ChatGPT. Total flow: 5 seconds from idea to answer." },
    { type: "heading", level: 2, text: "Earnings season prompts" },
    { type: "checklist", items: [
      "Summarize {company} Q3 earnings call in 5 bullet points focused on guidance.",
      "What did {company} CFO say about margins vs the prior quarter?",
      "Compare {company} earnings to consensus and react like a sell-side analyst.",
      "List 3 questions analysts asked {company} and why each matters.",
    ]},
    { type: "heading", level: 2, text: "Technical analysis prompts" },
    { type: "checklist", items: [
      "Act as a swing trader. Walk me through the daily setup on {ticker} given recent price action: {paste levels}.",
      "What invalidation level would make this {ticker} setup wrong?",
      "Compare RSI, MACD and volume signals on {ticker} — which is most actionable today?",
    ]},
    { type: "tool-card", toolId: "tradingview" },
    { type: "heading", level: 2, text: "Risk and journaling prompts" },
    { type: "checklist", items: [
      "Review my last 10 trades. Spot 3 mistakes and 2 strengths: {paste journal}.",
      "Build a checklist for me before I take any swing trade.",
      "Critique this trade plan as if you were a strict prop firm risk manager: {paste plan}.",
    ]},
    { type: "newsletter" },
    { type: "heading", level: 2, text: "Building your own custom GPT" },
    { type: "steps", title: "Setup in 5 minutes", steps: [
      { title: "Open ChatGPT", body: "Go to Explore → Create a GPT." },
      { title: "Define the trader you are", body: "Name, style (swing / day / options), risk per trade, instruments." },
      { title: "Paste your favorite prompts", body: "Add 5–10 of the prompts above as starter conversations." },
      { title: "Test", body: "Try a real workflow — earnings prep on a ticker — and refine instructions." },
      { title: "Pin it", body: "Pin to your sidebar. This is now your trading research analyst." },
    ]},
  ],
  faqs: [
    { q: "Is ChatGPT good for stock trading?", a: "For research and process work — yes. For live signals — no. Treat it as an analyst on call, not a forecaster." },
    { q: "Can ChatGPT pick stocks?", a: "It can shortlist candidates from a thesis you give it, but it can't see live prices and isn't tested as a stock-picker." },
    { q: "Which is better, ChatGPT or Claude, for trading?", a: "Both are strong. Claude often handles long earnings PDFs better; ChatGPT has stronger plugin/tool ecosystem. Try both for a week." },
  ],
  seo: {
    metaTitle: "50 ChatGPT Prompts for Traders (2026, Tested)",
    metaDescription: "Copy-paste ChatGPT prompts for stock research, earnings prep, technical analysis and trade journaling. Tested and ready to use.",
  },
  strategy: {
    focusKeyword: "chatgpt prompts for traders",
    secondaryKeywords: ["ai prompts for stocks","trading prompts","chatgpt for stock research"],
    intent: "informational",
    funnelStage: "TOFU",
    monetization: "newsletter",
    affiliateArticle: false,
    productCta: false,
  },
};

const post2 = {
  id: "p2",
  slug: "best-ai-tools-for-swing-traders-2026",
  title: "Best AI Tools for Swing Traders in 2026 (Tested)",
  subtitle: "Six tools we actually use after 30 days of side-by-side testing.",
  excerpt: "After 30 days of hands-on testing, here are the AI tools genuinely worth a swing trader's money — and three that aren't.",
  format: "listicle",
  status: "published",
  publishedAt: ts,
  createdAt: ts,
  updatedAt: ts,
  authorId: "team",
  categorySlug: "ai-for-traders",
  tagSlugs: ["chatgpt","swing-trading","screeners"],
  readTime: "11 min read",
  blocks: [
    { type: "tldr", text: "TrendSpider for charting + analysis. TradingView Pro for alerts. ChatGPT Plus for research. Skip the 'AI signal' Discords." },
    { type: "paragraph", text: "Every week brings another 'AI for traders' product launch. Most are wrappers. A handful actually move the needle. After 30 days of using each on a real swing book, here's what's worth your $/month." },
    { type: "comparison", tools: ["tradingview","trendspider","tradervue"], rows: [
      { label: "Best for", values: ["Charting + alerts","AI-augmented swing analysis","Trade journaling"] },
      { label: "Pricing", values: ["Free / $14.95+","From $39/mo","Free / $29+/mo"] },
      { label: "Mobile app", values: ["Excellent","Excellent","Good"] },
      { label: "Free tier?", values: ["Yes (limited)","No","Yes (limited)"] },
    ]},
    { type: "heading", level: 2, text: "1. TrendSpider — best AI charting overlay" },
    { type: "tool-card", toolId: "trendspider" },
    { type: "heading", level: 2, text: "2. TradingView — still the alerts king" },
    { type: "tool-card", toolId: "tradingview" },
    { type: "heading", level: 2, text: "3. Tradervue — your trading conscience" },
    { type: "tool-card", toolId: "tradervue" },
    { type: "callout", variant: "warning", title: "Skip these", text: "We tested 4 AI 'signal' Discord services. None outperformed buy-and-hold. Save your money." },
    { type: "cta", title: "Get our weekly tool tested-not-trusted breakdown", text: "Every Sunday — what's worth paying for, what to skip.", ctaLabel: "Subscribe (free)", ctaHref: "#newsletter", variant: "primary" },
    { type: "newsletter" },
  ],
  faqs: [
    { q: "Do I need all three of these tools?", a: "No. Start with TradingView (free) + Tradervue (free). Add TrendSpider once you're sizing trades meaningfully." },
    { q: "Are AI trading bots worth it?", a: "Mostly no for retail. The 'AI' is often a thin layer over basic technical rules. Build your own automation with Make.com instead." },
    { q: "What's the cheapest setup that still works?", a: "TradingView free + Notion journal + ChatGPT free. Total: $0/month. You'll outgrow it but it's enough to start." },
  ],
  seo: {
    metaTitle: "Best AI Tools for Swing Traders 2026 (Hands-On Test)",
    metaDescription: "Tested: 6 AI tools for swing traders. The 3 that earned a permanent spot in our workflow — and 3 that didn't survive a week.",
  },
  strategy: {
    focusKeyword: "best ai tools for swing traders",
    secondaryKeywords: ["ai tools for swing trading","best swing trading tools 2026","ai trading tools tested"],
    intent: "commercial",
    funnelStage: "MOFU",
    monetization: "affiliate",
    affiliateArticle: true,
    productCta: false,
  },
};

const post3 = {
  id: "p3",
  slug: "automate-trading-journal-notion",
  title: "How to Automate Your Trading Journal in Notion (Step by Step)",
  subtitle: "A 30-minute setup that ends manual journaling forever.",
  excerpt: "Build an automated Notion trading journal that pulls in fills from your broker, tags trades by setup and gives you weekly performance reviews.",
  format: "tutorial",
  status: "published",
  publishedAt: ts,
  createdAt: ts,
  updatedAt: ts,
  authorId: "team",
  categorySlug: "trading-automation",
  tagSlugs: ["notion","automation","make","no-code"],
  readTime: "8 min read",
  blocks: [
    { type: "tldr", text: "30 minutes of setup with Make.com + Notion API → every fill auto-logs to a journal page. Bonus: weekly AI summary every Sunday." },
    { type: "paragraph", text: "Manual trade journaling is the #1 thing serious traders quit. Solution: don't do it manually. Here's the exact stack to make your journal self-update." },
    { type: "key-takeaways", items: [
      "Make.com is the glue between your broker and Notion (free tier is enough).",
      "One template database in Notion holds every trade with rich properties.",
      "ChatGPT writes your weekly review automatically every Sunday at 6 PM.",
    ]},
    { type: "steps", title: "Build the system", steps: [
      { title: "Create the Notion database", body: "Properties: ticker, side, entry, exit, P&L, R, setup tag, screenshot, notes, date." },
      { title: "Get a Notion API token", body: "Go to notion.so/my-integrations → New integration → copy the token. Share your database with the integration." },
      { title: "Connect your broker to Make.com", body: "If your broker has a webhook (TradingView alerts, IBKR, Alpaca), point it at a Make.com webhook trigger." },
      { title: "Create the Make scenario", body: "Webhook → Notion 'Create database item' → done. Map each field." },
      { title: "Add the weekly summary", body: "Schedule a Sunday 6 PM Make scenario: Notion 'List items' (last 7 days) → ChatGPT 'Summarize trades' → Notion 'Append to journal'." },
    ]},
    { type: "callout", variant: "tip", title: "Free for most retail traders", text: "Make.com free tier handles 1,000 ops/month — easily enough for active swing traders." },
    { type: "heading", level: 2, text: "What to track" },
    { type: "checklist", items: [
      "Setup tag (so you can analyze edge per setup)",
      "R-multiple (not just $ P&L)",
      "Pre-trade screenshot",
      "Plan vs execution gap",
      "Mood / energy on entry",
    ]},
    { type: "internal-links", title: "Read next", links: [
      { label: "50 ChatGPT prompts for traders", href: "/blog/chatgpt-prompts-for-traders" },
      { label: "Best AI tools for swing traders", href: "/blog/best-ai-tools-for-swing-traders-2026" },
    ]},
    { type: "newsletter" },
  ],
  faqs: [
    { q: "Do I need to know how to code?", a: "No. Make.com is fully visual. The hardest step is reading Notion's API page — about 10 minutes." },
    { q: "Will this work with my broker?", a: "If your broker supports webhooks or API access (or you route via TradingView alerts), yes." },
    { q: "How much does it cost?", a: "$0 for most retail traders. Notion free + Make.com free + ChatGPT free is enough to start." },
  ],
  seo: {
    metaTitle: "Automate Trading Journal in Notion (Step-by-Step Tutorial)",
    metaDescription: "Build a self-updating trading journal in Notion using Make.com. 30 minutes of setup, zero manual entry from then on.",
  },
  strategy: {
    focusKeyword: "automate trading journal notion",
    secondaryKeywords: ["notion trading journal","trading journal automation","auto trade journal"],
    intent: "informational",
    funnelStage: "TOFU",
    monetization: "newsletter",
    affiliateArticle: false,
    productCta: true,
  },
};

// ── Run ────────────────────────────────────────────────────
async function main() {
  for (const d of dirs) await ensureDir(path.join(ROOT, d));

  for (const a of authors) await write("authors", a.id, a);
  for (const c of categories) await write("categories", c.slug, c);
  for (const t of tags) await write("tags", t.slug, t);
  for (const t of tools) await write("tools", t.id, t);
  for (const k of keywordSeed) await write("keywords", k.id, k);
  for (const t of testimonials) await write("testimonials", t.id, t);

  await write("posts", post1.slug, post1);
  await write("posts", post2.slug, post2);
  await write("posts", post3.slug, post3);

  console.log("✓ Seeded:");
  console.log(`  ${authors.length} author(s)`);
  console.log(`  ${categories.length} categories`);
  console.log(`  ${tags.length} tags`);
  console.log(`  ${tools.length} tools`);
  console.log(`  ${keywordSeed.length} keywords`);
  console.log(`  ${testimonials.length} testimonials`);
  console.log(`  3 sample posts`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
