// Stop Loss Calculator config.
//
// Target keyword: "stop loss calculator"
// Ahrefs: 173 vol / KD 2 / Traffic Potential 200.
// Lowest-difficulty calculator in the niche — this is a near-guaranteed
// top-3 rank within 2-4 weeks of indexing.

import type { CalculatorConfig } from "./types";

export const stopLossCalculator: CalculatorConfig = {
  slug: "stop-loss-calculator",
  title: "Stop Loss Calculator — Find Your Exit Before You Enter",
  metaDescription:
    "Free stop loss calculator. Enter your account size, risk %, entry price, and share count — get the exact stop-loss price that caps your loss at your target risk.",
  focusKeyword: "stop loss calculator",
  secondaryKeywords: [
    "stop loss calculator stocks",
    "where to set stop loss",
    "stop loss price calculator",
    "percent stop loss calculator",
    "trade stop loss formula",
  ],
  intro:
    "A stop loss calculator works backward from your max acceptable loss to the exact price you should exit at if a trade goes wrong. Enter your account size, the percent you're willing to risk, your entry price, and the number of shares you plan to buy — we'll calculate the stop-loss price that limits your loss to your target risk amount.",
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
      key: "riskPercent",
      label: "Max risk per trade",
      help: "Percentage of your account you're willing to lose if this trade fails. 1-2% is the standard.",
      type: "percent",
      default: 1,
      min: 0.1,
      max: 100,
      step: 0.1,
      suffix: "%",
    },
    {
      key: "entryPrice",
      label: "Entry price",
      help: "The price you plan to buy at.",
      type: "currency",
      default: 100,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "shares",
      label: "Number of shares",
      help: "How many shares you're buying (or planning to buy).",
      type: "number",
      default: 50,
      min: 1,
      step: 1,
      suffix: "shares",
    },
  ],
  outputs: [
    {
      key: "stopLossPrice",
      label: "Stop-loss price",
      format: "currency",
      hint: "Exit here if the trade goes against you. For longs, set this on entry — don't wing it later.",
      primary: true,
    },
    {
      key: "stopDistancePercent",
      label: "Stop distance from entry",
      format: "percent",
      hint: "How far the price needs to fall to hit your stop.",
      primary: true,
    },
    {
      key: "riskPerShare",
      label: "Risk per share",
      format: "currency",
      hint: "Per-share loss if your stop triggers.",
    },
    {
      key: "totalDollarRisk",
      label: "Total dollar risk",
      format: "currency",
      hint: "Total loss if the trade fails — should match your account-risk target.",
    },
    {
      key: "positionValue",
      label: "Position value",
      format: "currency",
      hint: "Total capital deployed in this trade.",
    },
  ],
  compute: ({ accountSize, riskPercent, entryPrice, shares }) => {
    const totalDollarRisk = accountSize * (riskPercent / 100);
    const riskPerShare = shares > 0 ? totalDollarRisk / shares : 0;
    const stopLossPrice = Math.max(0, entryPrice - riskPerShare);
    const stopDistancePercent =
      entryPrice > 0 ? (riskPerShare / entryPrice) * 100 : 0;
    const positionValue = shares * entryPrice;
    return {
      stopLossPrice,
      stopDistancePercent,
      riskPerShare,
      totalDollarRisk,
      positionValue,
    };
  },
  example: {
    title: "Worked example",
    inputs: {
      accountSize: 25000,
      riskPercent: 1,
      entryPrice: 100,
      shares: 50,
    },
    explanation:
      "You have a $25,000 account and you'll risk 1% ($250) on this trade. You're buying 50 shares at $100 (a $5,000 position). Your per-share risk = $250 ÷ 50 shares = $5/share. Set your stop-loss at $100 − $5 = $95, which is a 5% drop from entry. If price hits $95, you exit and lose exactly $250 — your pre-defined max risk.",
  },
  faqs: [
    {
      q: "What is a stop loss calculator?",
      a: "A stop loss calculator works backward from your maximum acceptable loss to the exact price you should exit at. You input your account size, risk percentage, entry price, and share count — it returns the stop-loss price that caps your loss at the target amount. It removes guesswork from setting stops.",
    },
    {
      q: "What's a good stop loss percentage?",
      a: "Most swing traders set stops 3-8% below entry; day traders 0.5-2%. The right number depends on the stock's average true range (ATR) and your strategy's win rate. A stop too tight gets shaken out by normal noise; a stop too wide kills your risk/reward math. Use ATR × 1.5-2 as a starting point.",
    },
    {
      q: "Should I use a hard stop or a mental stop?",
      a: "Use a hard stop (a real order placed with your broker). Mental stops fail in fast markets, after-hours news, and during connectivity outages — exactly when you need them most. The only exception is highly illiquid stocks where stop orders can be picked off by HFTs, in which case use a stop-limit.",
    },
    {
      q: "Does the calculator account for slippage and commissions?",
      a: "No — the result is the theoretical exit price. On commission-free brokers (Robinhood, Fidelity, Schwab) with liquid US equities, slippage on a stop order is typically $0.01-0.05/share. Subtract that from your stop price if you want a more conservative real-world number, or just risk slightly less than your target to absorb it.",
    },
    {
      q: "What's the difference between a stop loss and a trailing stop?",
      a: "A fixed stop loss stays at the same price; a trailing stop moves up with the stock (locking in gains as it rises but never moving down). Use a fixed stop on entry, then convert to a trailing stop once the trade is 1R+ in profit. This calculator computes the initial fixed stop.",
    },
    {
      q: "How is this different from the position size calculator?",
      a: "Position size calculator: you know your stop, it tells you how many shares to buy. Stop loss calculator: you know how many shares you're buying, it tells you where to set the stop. They're inverses of the same formula — use whichever matches your decision order.",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
