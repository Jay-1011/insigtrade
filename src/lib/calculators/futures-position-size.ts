// Futures Position Size Calculator config.
//
// Target keyword: "futures position size calculator"
// Ahrefs: 225 vol / KD 38 / Traffic Potential 3,500.
//
// Futures use contract multipliers (dollar value per 1.00 price move):
//   ES (E-mini S&P)      = $50/point
//   MES (Micro S&P)      = $5/point
//   NQ (E-mini Nasdaq)   = $20/point
//   MNQ (Micro Nasdaq)   = $2/point
//   YM (E-mini Dow)      = $5/point
//   CL (Crude Oil)       = $1,000/point ($10/tick × 100 ticks)
//   GC (Gold)            = $100/point
//   ZB (30y Treasury)    = $1,000/point
//
// Inputs use raw multiplier so the calc handles any contract. We list
// the popular ones in the help text.

import type { CalculatorConfig } from "./types";

export const futuresPositionSizeCalculator: CalculatorConfig = {
  slug: "futures-position-size-calculator",
  title: "Futures Position Size Calculator (ES, NQ, CL, GC, Micros)",
  metaDescription:
    "Free futures position size calculator. Enter account, risk %, stop distance in points, and contract multiplier — get exact contract count for ES, NQ, CL, GC, or any futures product.",
  focusKeyword: "futures position size calculator",
  secondaryKeywords: [
    "es position size calculator",
    "nq position size calculator",
    "futures contract size calculator",
    "micro futures position sizing",
    "crude oil futures risk calculator",
  ],
  intro:
    "Futures position sizing is different from stocks because each contract represents a fixed dollar move per point. Enter your account size, risk per trade, stop distance in points, and the contract's dollar multiplier — we calculate how many contracts you can trade without exceeding your risk budget. Defaults to ES (E-mini S&P 500) at $50/point.",
  inputs: [
    {
      key: "accountSize",
      label: "Account size",
      help: "Total futures account capital (USD).",
      type: "currency",
      default: 25000,
      min: 1000,
      step: 100,
      prefix: "$",
    },
    {
      key: "riskPercent",
      label: "Risk per trade",
      help: "% of account you're willing to lose on this trade. 0.5-1% is conservative for futures given leverage.",
      type: "percent",
      default: 1,
      min: 0.1,
      max: 100,
      step: 0.1,
      suffix: "%",
    },
    {
      key: "stopDistancePoints",
      label: "Stop distance",
      help: "How many points away your stop sits. ES day-trade: 2-10 pts. Swing: 20-50 pts.",
      type: "number",
      default: 5,
      min: 0.01,
      step: 0.01,
      suffix: "points",
    },
    {
      key: "contractMultiplier",
      label: "Contract multiplier",
      help: "Dollar value per 1.00 point move. ES=$50, MES=$5, NQ=$20, MNQ=$2, YM=$5, CL=$1000, GC=$100, ZB=$1000.",
      type: "currency",
      default: 50,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "entryPrice",
      label: "Entry price (optional)",
      help: "Used for the position-notional output. Enter 0 to skip.",
      type: "currency",
      default: 5800,
      min: 0,
      step: 0.01,
      prefix: "$",
    },
  ],
  outputs: [
    {
      key: "contracts",
      label: "Contracts to trade",
      format: "integer",
      hint: "Round down — never exceed your risk budget. If 0, the stop is too wide for your account at this multiplier.",
      primary: true,
    },
    {
      key: "actualDollarRisk",
      label: "Actual dollar risk",
      format: "currency",
      hint: "Slightly less than max-risk because we floor contracts to whole numbers.",
      primary: true,
    },
    {
      key: "maxDollarRisk",
      label: "Max allowed risk",
      format: "currency",
      hint: "Your account-size × risk%. Actual risk is below this.",
    },
    {
      key: "riskPerContract",
      label: "Risk per contract",
      format: "currency",
      hint: "Stop distance × multiplier. The exposure of one contract.",
    },
    {
      key: "positionNotional",
      label: "Position notional",
      format: "currency",
      hint: "Entry × multiplier × contracts — the full contract value (NOT margin requirement).",
    },
  ],
  compute: ({
    accountSize,
    riskPercent,
    stopDistancePoints,
    contractMultiplier,
    entryPrice,
  }) => {
    const maxDollarRisk = accountSize * (riskPercent / 100);
    const riskPerContract = stopDistancePoints * contractMultiplier;
    const contracts =
      riskPerContract > 0 ? Math.floor(maxDollarRisk / riskPerContract) : 0;
    const actualDollarRisk = contracts * riskPerContract;
    const positionNotional =
      entryPrice > 0 ? contracts * contractMultiplier * entryPrice : 0;
    return {
      contracts,
      actualDollarRisk,
      maxDollarRisk,
      riskPerContract,
      positionNotional,
    };
  },
  example: {
    title: "Worked example (ES on a $25k account)",
    inputs: {
      accountSize: 25000,
      riskPercent: 1,
      stopDistancePoints: 5,
      contractMultiplier: 50,
      entryPrice: 5800,
    },
    explanation:
      "You have a $25,000 account, willing to risk 1% ($250) per trade, trading ES (E-mini S&P, $50/point) with a 5-point stop. Risk per contract = 5 × $50 = $250 — which exactly matches your max risk. So you trade 1 contract. If you wanted to trade 2 contracts at this risk budget, you'd need either a 2.5-point stop OR a $50k account. This is why most beginner futures traders use the micros (MES at $5/point) — same strategy at 1/10th the dollar risk per contract.",
  },
  faqs: [
    {
      q: "What's a futures contract multiplier?",
      a: "The contract multiplier is the dollar value of a 1.00 point move in the underlying. ES (E-mini S&P) = $50, meaning if ES moves from 5800 to 5801, one long contract makes $50. Multipliers are set by the exchange and never change for a given contract. Check the CME/NYMEX product specs page for any contract you trade.",
    },
    {
      q: "Should I trade ES or MES as a beginner?",
      a: "Start with MES (Micro E-mini S&P). It's the same product as ES but at 1/10th the contract size ($5/point vs $50/point). A 10-point stop on MES risks $50; on ES it risks $500. Beginners who jump straight to ES with under $25k typically blow up on a single bad day. MES lets you practice the strategy with manageable dollar amounts.",
    },
    {
      q: "How much account do I need to trade futures?",
      a: "Technically you can open a futures account with as little as $500-1,000 if you only trade micros and use day-trade margin. Realistically, for ES day-trading you want at least $10,000; for swing trading $25,000+. The PDT rule doesn't apply to futures (you can day-trade with any account size), which is part of their appeal vs stocks.",
    },
    {
      q: "Does this calculator account for futures margin?",
      a: "No — the calculator sizes by risk, not by margin. Margin (the deposit required to hold a contract) is set by your broker and varies: ES intraday margin is often $500-1,000, overnight $13,200. Always confirm you have enough excess margin to hold the position. Risk-based sizing is what keeps you in the game; margin-based sizing is what gets people blown up.",
    },
    {
      q: "What's the difference between points and ticks?",
      a: "A point is a 1.00 move in the underlying (ES from 5800 to 5801). A tick is the minimum price increment, which is smaller. ES ticks in 0.25 (so 1 point = 4 ticks, each tick = $12.50 on a full ES, $1.25 on MES). When this calculator says 'stop distance in points,' enter the points — we'll handle the math.",
    },
    {
      q: "Can I use this for forex or options?",
      a: "Not directly. Forex uses pip values and lot sizes (use our forex position size calculator). Options use contract premium and delta — much more complex sizing. This calculator is built specifically for futures with fixed point multipliers (equity index, energy, metals, treasuries, ag).",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
