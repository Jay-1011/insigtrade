// Trading Risk Calculator config.
//
// Target keyword: "trading risk calculator"
// Ahrefs: 181 vol / KD 58 / Traffic Potential 9,900 (huge — this is a
// hub query for the entire risk-management cluster).
//
// Distinct from position-size in that the trader already KNOWS their
// share count and wants to verify the risk is acceptable. Also computes
// risk-of-ruin signals (max consecutive losses tolerable).

import type { CalculatorConfig } from "./types";

export const tradingRiskCalculator: CalculatorConfig = {
  slug: "trading-risk-calculator",
  title: "Trading Risk Calculator — Verify You're Sized Right",
  metaDescription:
    "Free trading risk calculator. Enter your trade details — see total $ risk, % of account at risk, and how many consecutive losses you could survive at this sizing.",
  focusKeyword: "trading risk calculator",
  secondaryKeywords: [
    "stock trading risk calculator",
    "trade risk percentage calculator",
    "account risk per trade calculator",
    "risk of ruin calculator",
    "consecutive losses calculator",
  ],
  intro:
    "Use this calculator after you've sketched out a trade to verify the risk is acceptable. Enter your account size, entry, stop, and share count — we'll show your total dollar risk, the percent of your account at stake, your R-multiple, and the most important number most retail traders never compute: how many consecutive losses you could absorb before hitting a critical 20% drawdown.",
  inputs: [
    {
      key: "accountSize",
      label: "Account size",
      help: "Total trading capital (USD).",
      type: "currency",
      default: 25000,
      min: 100,
      step: 100,
      prefix: "$",
    },
    {
      key: "entryPrice",
      label: "Entry price",
      type: "currency",
      default: 100,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "stopLossPrice",
      label: "Stop-loss price",
      type: "currency",
      default: 95,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "shares",
      label: "Number of shares",
      help: "Position size you're considering.",
      type: "number",
      default: 50,
      min: 1,
      step: 1,
      suffix: "shares",
    },
  ],
  outputs: [
    {
      key: "totalDollarRisk",
      label: "Total dollar risk",
      format: "currency",
      hint: "If stop hits, this is your loss.",
      primary: true,
    },
    {
      key: "percentOfAccount",
      label: "% of account at risk",
      format: "percent",
      hint: "Your single-trade risk as a fraction of total capital. Should be 0.5-2% for most retail strategies.",
      primary: true,
    },
    {
      key: "positionValue",
      label: "Position value",
      format: "currency",
      hint: "Total capital deployed in the trade.",
    },
    {
      key: "percentOfAccountDeployed",
      label: "% of account deployed",
      format: "percent",
      hint: "Different from risk — this is total capital tied up, not the amount at risk.",
    },
    {
      key: "consecutiveLossesTo20",
      label: "Losing streak to -20% drawdown",
      format: "integer",
      hint: "How many back-to-back stop-outs at THIS sizing would put you at a 20% account drawdown. Above 20 = sustainable. Below 10 = oversized.",
    },
  ],
  compute: ({ accountSize, entryPrice, stopLossPrice, shares }) => {
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const totalDollarRisk = shares * riskPerShare;
    const percentOfAccount =
      accountSize > 0 ? (totalDollarRisk / accountSize) * 100 : 0;
    const positionValue = shares * entryPrice;
    const percentOfAccountDeployed =
      accountSize > 0 ? (positionValue / accountSize) * 100 : 0;
    // How many consecutive losses to reach a 20% drawdown, assuming each
    // loss is sized at the same % of (then-current) account. Geometric.
    //   account * (1 - r)^n = account * 0.8
    //   n = log(0.8) / log(1 - r)
    const r = percentOfAccount / 100;
    const consecutiveLossesTo20 =
      r > 0 && r < 1
        ? Math.floor(Math.log(0.8) / Math.log(1 - r))
        : 0;
    return {
      totalDollarRisk,
      percentOfAccount,
      positionValue,
      percentOfAccountDeployed,
      consecutiveLossesTo20,
    };
  },
  example: {
    title: "Worked example",
    inputs: {
      accountSize: 25000,
      entryPrice: 100,
      stopLossPrice: 95,
      shares: 50,
    },
    explanation:
      "On a $25,000 account, you're considering 50 shares at $100 with a $95 stop. Risk per share is $5. Total dollar risk = 50 × $5 = $250, which is 1% of your account. Position value is $5,000 (20% of account deployed, but only 1% at risk). At 1% risk per loss, you could absorb 22 consecutive losses before hitting a 20% account drawdown — well into 'sustainable' territory.",
  },
  faqs: [
    {
      q: "What's a safe percentage of my account to risk per trade?",
      a: "Most professional traders cap per-trade risk at 0.5-2% of account. At 1% risk, you'd need 22 consecutive losses to reach a 20% drawdown — statistically improbable for any strategy with >40% win rate. At 5% risk, you'd hit 20% drawdown in just 4 consecutive losses. The math gets hostile fast above 2%.",
    },
    {
      q: "What's the difference between risk and position value?",
      a: "Position value = total dollars tied up in the trade (shares × entry price). Risk = the much smaller amount you'd actually lose if your stop hits (shares × distance to stop). A $5,000 position with a $5 stop on a $100 stock only risks $250 — your whole account isn't on the line, just the small slice between entry and stop.",
    },
    {
      q: "How is consecutive-losses-to-drawdown calculated?",
      a: "We use geometric compounding: each loss is a percentage of the now-smaller account. Formula: n = log(0.8) ÷ log(1 − risk_per_trade). At 1% risk, that's log(0.8)/log(0.99) ≈ 22 trades. At 2% it's ~11. At 5% it's ~4. The math is a powerful argument for keeping per-trade risk low.",
    },
    {
      q: "Should I include slippage and commissions in my risk?",
      a: "For tight risk control, yes — your real loss when a stop hits is (stop distance + slippage) × shares, plus round-trip commissions. On commission-free brokers with liquid stocks this is rounding error. On options or thinly-traded names it can be 20-50% of the calculated risk. Add 5-10% buffer if you're being precise.",
    },
    {
      q: "Is a 1% risk-per-trade rule too conservative?",
      a: "Not for most retail traders. The math says 1% gives you ~22 trades of headroom before a 20% drawdown — meaning even a 30% win rate strategy is statistically survivable. 'Conservative' here just means 'gives you the room to keep trading when you're cold.' Pros add up over thousands of trades, not by sizing big on any single one.",
    },
    {
      q: "How does this differ from a position size calculator?",
      a: "Position size calculator: you have entry + stop + risk target, it tells you the share count. Trading risk calculator: you have entry + stop + share count, it tells you the resulting risk. Use trading-risk to verify a planned trade; use position-size to plan one from scratch.",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
