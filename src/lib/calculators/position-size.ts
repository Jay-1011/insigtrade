// Position Size Calculator config.
//
// Target keyword: "position size calculator"
// Ahrefs: 1,878 vol / KD 49 / Traffic Potential 9,700 / no AI Overview
// (calculator queries don't get an AI Overview because Google can't run
// the calculator inline — they have to send the click to a page).
//
// Formula:
//   max_loss_dollars   = account_size * (risk_percent / 100)
//   per_share_risk     = |entry_price - stop_loss_price|
//   position_size_shrs = floor(max_loss_dollars / per_share_risk)
//   position_value     = position_size_shrs * entry_price
//   risk_reward_ratio  = (target_price - entry_price) / (entry_price - stop_loss_price)

import type { CalculatorConfig } from "./types";

export const positionSizeCalculator: CalculatorConfig = {
  slug: "position-size-calculator",
  title: "Position Size Calculator (Free, Built for Active Traders)",
  metaDescription:
    "Free position size calculator. Enter your account size, risk %, entry, and stop — get your exact share count, dollar risk, and R:R in one click.",
  focusKeyword: "position size calculator",
  secondaryKeywords: [
    "trading position size calculator",
    "stock position size calculator",
    "how to calculate position size",
    "risk-based position sizing",
    "fixed percent position sizing",
  ],
  intro:
    "A position size calculator tells you exactly how many shares to buy so a single losing trade can't blow up your account. Enter your account size, the percent you're willing to risk, your entry price, and your stop-loss price. We do the math: you get a share count, your dollar risk, and your risk-reward ratio if you also enter a target.",
  inputs: [
    {
      key: "accountSize",
      label: "Account size",
      help: "Total capital in your trading account (USD).",
      type: "currency",
      default: 25000,
      min: 100,
      step: 100,
      prefix: "$",
    },
    {
      key: "riskPercent",
      label: "Risk per trade",
      help: "% of account you're willing to lose on this single trade. 1-2% is the standard for most traders.",
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
      key: "stopLossPrice",
      label: "Stop-loss price",
      help: "Where you'll exit if the trade goes against you. For longs, this should be below entry.",
      type: "currency",
      default: 95,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "targetPrice",
      label: "Target price (optional)",
      help: "Your profit target. Enter 0 to skip the risk/reward output.",
      type: "currency",
      default: 110,
      min: 0,
      step: 0.01,
      prefix: "$",
    },
  ],
  outputs: [
    {
      key: "shares",
      label: "Position size",
      format: "integer",
      hint: "Round down — never buy more shares than the formula allows.",
      primary: true,
    },
    {
      key: "dollarRisk",
      label: "Total dollar risk",
      format: "currency",
      hint: "If your stop hits, this is your loss.",
      primary: true,
    },
    {
      key: "positionValue",
      label: "Position value",
      format: "currency",
      hint: "Total capital deployed in this trade.",
    },
    {
      key: "riskPerShare",
      label: "Risk per share",
      format: "currency",
      hint: "Entry minus stop — the distance you're risking on each share.",
    },
    {
      key: "riskRewardRatio",
      label: "Risk / reward ratio",
      format: "ratio",
      hint: "Reward per $1 risked. Most pros only take trades with R:R >= 2:1.",
    },
  ],
  compute: ({
    accountSize,
    riskPercent,
    entryPrice,
    stopLossPrice,
    targetPrice,
  }) => {
    const maxLossDollars = accountSize * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const shares = riskPerShare > 0 ? Math.floor(maxLossDollars / riskPerShare) : 0;
    const positionValue = shares * entryPrice;
    const dollarRisk = shares * riskPerShare;
    const rewardPerShare = targetPrice > 0 ? Math.abs(targetPrice - entryPrice) : 0;
    const riskRewardRatio =
      rewardPerShare > 0 && riskPerShare > 0
        ? rewardPerShare / riskPerShare
        : 0;
    return {
      shares,
      dollarRisk,
      positionValue,
      riskPerShare,
      riskRewardRatio,
    };
  },
  example: {
    title: "Worked example",
    inputs: {
      accountSize: 25000,
      riskPercent: 1,
      entryPrice: 100,
      stopLossPrice: 95,
      targetPrice: 110,
    },
    explanation:
      "You have a $25,000 account and you're willing to risk 1% ($250) on this trade. You plan to buy at $100 and exit at $95 if the trade fails — that's $5 of risk per share. So you buy $250 / $5 = 50 shares. Your total position value is $5,000 (20% of your account, but only 1% is at risk). If price hits $110 your reward is $10/share = $500, giving a 2:1 R:R.",
  },
  faqs: [
    {
      q: "What is a position size calculator?",
      a: "A position size calculator tells you how many shares to buy on a trade so that if your stop-loss hits, you only lose a pre-set percentage of your account (typically 1-2%). It takes the math out of risk management — you input account size, risk %, entry, and stop, and it returns your exact share count.",
    },
    {
      q: "What's a good risk percent per trade?",
      a: "Most professional and serious retail traders risk 0.5% to 2% of their account per trade. Risking 1% means you'd need a 100-trade losing streak to blow up your account, which is statistically improbable. Higher than 2% per trade dramatically raises your risk of ruin even with a 60% win rate.",
    },
    {
      q: "Should I include commissions and slippage?",
      a: "For exact precision, yes — subtract round-trip commissions and expected slippage from your max loss before dividing. For most retail trades on commission-free brokers (Robinhood, Fidelity, Schwab), the impact is small enough to ignore. For options or futures, factor them in explicitly.",
    },
    {
      q: "How is position size different from position value?",
      a: "Position size = number of shares. Position value = shares × entry price (total capital tied up). Risk = the small portion of that value you'd actually lose if your stop hits. A 50-share position at $100 entry has $5,000 of position value but might only have $250 of risk if your stop is $5 below entry.",
    },
    {
      q: "Can I use this for forex or futures?",
      a: "Not directly — forex uses pip values and lot sizing, futures use contract values and tick multipliers. This calculator is built for stocks and ETFs. We'll publish dedicated forex and futures position-size calculators on Insigtrade next.",
    },
    {
      q: "What does R-multiple or 1R mean?",
      a: "1R is the amount you're risking on a trade (your max loss). A 2R winner means you made twice your risk. Position sizing makes 1R consistent across trades — every trade risks the same dollar amount, so a 3R win after a 1R loss leaves you up 2R, regardless of whether the trade was a $5 stock or a $200 stock.",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
