// Forex Position Size Calculator config.
//
// Target keyword: "forex position size calculator"
// Ahrefs: 579 vol / KD 56 / Traffic Potential 9,800.
//
// Forex position sizing uses pip values + lot sizes:
//   Standard lot = 100,000 units (1 pip on most USD-quote pairs = $10)
//   Mini lot     = 10,000 units  (1 pip ≈ $1)
//   Micro lot    = 1,000 units   (1 pip ≈ $0.10)
//   Nano lot     = 100 units     (1 pip ≈ $0.01) — not all brokers offer
//
// Pip value varies slightly with the quote currency, but for USD-quote
// pairs (EUR/USD, GBP/USD, AUD/USD, NZD/USD) it's exactly $10 per pip on
// a standard lot. For pairs where USD is the BASE (USD/JPY, USD/CAD,
// USD/CHF), the pip value fluctuates with the exchange rate but is close
// to $10. We default to $10 as the input and let advanced users adjust.

import type { CalculatorConfig } from "./types";

export const forexPositionSizeCalculator: CalculatorConfig = {
  slug: "forex-position-size-calculator",
  title: "Forex Position Size Calculator (Lots, Pips, USD Risk)",
  metaDescription:
    "Free forex position size calculator. Enter account, risk %, stop distance in pips, and pip value — get exact lots (standard, mini, micro) for any currency pair.",
  focusKeyword: "forex position size calculator",
  secondaryKeywords: [
    "forex lot size calculator",
    "fx position sizing calculator",
    "currency trading position size",
    "pip value calculator",
    "forex risk calculator",
  ],
  intro:
    "Forex position sizing translates a risk percentage into the right lot size for any currency pair. Enter your account size, the percent you're risking, your stop distance in pips, and the pip value (defaults to $10/pip for standard-lot EUR/USD). We'll return your lots in standard, mini, and micro — pick whichever your broker offers.",
  inputs: [
    {
      key: "accountSize",
      label: "Account size",
      help: "Total forex account capital (USD).",
      type: "currency",
      default: 10000,
      min: 100,
      step: 100,
      prefix: "$",
    },
    {
      key: "riskPercent",
      label: "Risk per trade",
      help: "% of account you're willing to lose if your stop hits. 0.5-2% is the standard.",
      type: "percent",
      default: 1,
      min: 0.1,
      max: 100,
      step: 0.1,
      suffix: "%",
    },
    {
      key: "stopDistancePips",
      label: "Stop distance (pips)",
      help: "How many pips away from entry your stop sits. Scalp: 5-15. Day-trade: 20-50. Swing: 50-200.",
      type: "number",
      default: 20,
      min: 0.1,
      step: 0.1,
      suffix: "pips",
    },
    {
      key: "pipValuePerStdLot",
      label: "Pip value (per standard lot)",
      help: "USD per pip on a 100k-unit lot. EUR/USD, GBP/USD, AUD/USD, NZD/USD = $10. USD/JPY ≈ $9.20 at 109.00. Check your broker's pip-value tool for exact numbers.",
      type: "currency",
      default: 10,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
  ],
  outputs: [
    {
      key: "standardLots",
      label: "Standard lots (100k)",
      format: "number",
      hint: "Round down to the nearest 0.01 for most brokers. If under 0.01, use mini or micro lots.",
      primary: true,
    },
    {
      key: "miniLots",
      label: "Mini lots (10k)",
      format: "number",
      hint: "1 mini lot = 0.1 standard. Most retail-friendly size.",
      primary: true,
    },
    {
      key: "microLots",
      label: "Micro lots (1k)",
      format: "number",
      hint: "1 micro lot = 0.01 standard. Best for small accounts or testing.",
    },
    {
      key: "unitsOfBaseCurrency",
      label: "Position size (units)",
      format: "integer",
      hint: "Total units of the base currency you'd buy or sell.",
    },
    {
      key: "actualDollarRisk",
      label: "Dollar risk at this size",
      format: "currency",
      hint: "Slightly less than max-risk because we round lots to typical broker steps.",
    },
  ],
  compute: ({
    accountSize,
    riskPercent,
    stopDistancePips,
    pipValuePerStdLot,
  }) => {
    const maxDollarRisk = accountSize * (riskPercent / 100);
    const riskPerStdLot = stopDistancePips * pipValuePerStdLot;
    const standardLots =
      riskPerStdLot > 0 ? Math.floor((maxDollarRisk / riskPerStdLot) * 100) / 100 : 0; // 0.01 step
    const miniLots = standardLots * 10;
    const microLots = standardLots * 100;
    const unitsOfBaseCurrency = Math.round(standardLots * 100000);
    const actualDollarRisk = standardLots * riskPerStdLot;
    return {
      standardLots,
      miniLots,
      microLots,
      unitsOfBaseCurrency,
      actualDollarRisk,
    };
  },
  example: {
    title: "Worked example (EUR/USD on a $10k account)",
    inputs: {
      accountSize: 10000,
      riskPercent: 1,
      stopDistancePips: 20,
      pipValuePerStdLot: 10,
    },
    explanation:
      "You have a $10,000 account, risking 1% ($100) per trade on EUR/USD with a 20-pip stop. Risk per standard lot = 20 pips × $10/pip = $200. So you trade 0.5 standard lots ($100 ÷ $200), which equals 5 mini lots or 50 micro lots — same position size, three different ways to enter it on your broker. Your actual risk is exactly $100 because we rounded to the standard 0.01 lot step.",
  },
  faqs: [
    {
      q: "What's a pip in forex?",
      a: "A pip ('point in percentage') is the smallest standard price move for a currency pair. For most pairs (EUR/USD, GBP/USD), one pip is 0.0001 — so 1.0800 to 1.0801 is one pip. For JPY pairs (USD/JPY, EUR/JPY), one pip is 0.01 because the pair is quoted to 2 decimals. Pip value depends on lot size + the quote currency.",
    },
    {
      q: "What's the difference between standard, mini, and micro lots?",
      a: "Standard lot = 100,000 units of base currency (~$10/pip). Mini lot = 10,000 units (~$1/pip). Micro lot = 1,000 units (~$0.10/pip). Most retail brokers let you trade in 0.01 standard-lot increments — that's the same as micro lots. Use micro/mini lots for small accounts and standard for accounts $25k+.",
    },
    {
      q: "Why does pip value matter for position sizing?",
      a: "Because risk = stop_distance_in_pips × pip_value × lots. If you misjudge pip value, you misjudge risk. For USD-quote pairs (EUR/USD, GBP/USD, AUD/USD, NZD/USD), pip value is always $10 per standard lot — easy. For USD-base pairs (USD/JPY, USD/CAD) it changes with the exchange rate. Cross pairs (EUR/GBP, AUD/NZD) need an additional conversion to USD.",
    },
    {
      q: "How is forex sizing different from stock sizing?",
      a: "Stocks use share count (integer). Forex uses lots (fractional, but stepped at 0.01 standard for most brokers). Stocks have one entry price; forex has a bid/ask spread that costs you 0.5-3 pips per round trip. Stocks settle T+2; forex is leveraged and rolled overnight. The underlying risk math is identical — just the units differ.",
    },
    {
      q: "What's a reasonable stop distance in forex?",
      a: "Depends on timeframe. Scalpers: 5-15 pips. Day-traders: 20-50 pips. Swing traders: 50-200 pips. Position traders may use 200-500. A useful default is 1× the daily ATR of the pair — for EUR/USD that's currently about 60-80 pips. Wider than 1× ATR if you're holding through news.",
    },
    {
      q: "Should I trade standard or mini lots starting out?",
      a: "Mini lots. On a $5k account, one standard lot at 1% risk gives you only a 5-pip stop budget — not enough room for even a tight scalp. Mini or micro lots let you use sensible 20-50 pip stops while keeping risk at 1%. Move to standard lots only when account size makes the pip math work (~$25k+).",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
