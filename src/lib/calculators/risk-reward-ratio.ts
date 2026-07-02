// Risk/Reward Ratio Calculator config.
//
// Target keyword: "risk reward ratio calculator"
// Ahrefs: 168 vol / KD 20 / Traffic Potential 300.
// Bonus output: required win-rate to break even at the entered R:R —
// this is the underappreciated half of risk-reward analysis.

import type { CalculatorConfig } from "./types";

export const riskRewardRatioCalculator: CalculatorConfig = {
  slug: "risk-reward-ratio-calculator",
  title: "Risk/Reward Ratio Calculator (with Breakeven Win Rate)",
  metaDescription:
    "Free risk/reward ratio calculator. Enter your entry, stop, and target — get the R:R ratio plus the win rate you need to break even at that ratio.",
  focusKeyword: "risk reward ratio calculator",
  secondaryKeywords: [
    "risk to reward ratio calculator",
    "r:r calculator trading",
    "trading risk reward ratio",
    "breakeven win rate calculator",
    "1:2 risk reward calculator",
  ],
  intro:
    "Your risk/reward ratio tells you how many dollars you stand to gain for each dollar you risk on a trade. Enter your planned entry, stop-loss, and target prices — we'll calculate the R:R ratio plus the all-important breakeven win rate. A 1:2 R:R only needs a 33% win rate to be profitable; a 1:1 R:R needs more than 50%.",
  inputs: [
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
      help: "The price you'll exit at if the trade fails (below entry for longs).",
      type: "currency",
      default: 95,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "targetPrice",
      label: "Target price",
      help: "Your profit target (above entry for longs).",
      type: "currency",
      default: 115,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
  ],
  outputs: [
    {
      key: "riskRewardRatio",
      label: "Risk / reward ratio",
      format: "ratio",
      hint: "Reward per $1 risked. Most pros require at least 2:1 (i.e., 2.00).",
      primary: true,
    },
    {
      key: "breakevenWinRate",
      label: "Breakeven win rate",
      format: "percent",
      hint: "The minimum % of trades you need to win to break even at this R:R.",
      primary: true,
    },
    {
      key: "riskPerShare",
      label: "Risk per share",
      format: "currency",
      hint: "Entry minus stop — your downside per share.",
    },
    {
      key: "rewardPerShare",
      label: "Reward per share",
      format: "currency",
      hint: "Target minus entry — your upside per share.",
    },
  ],
  compute: ({ entryPrice, stopLossPrice, targetPrice }) => {
    const riskPerShare = Math.abs(entryPrice - stopLossPrice);
    const rewardPerShare = Math.abs(targetPrice - entryPrice);
    const riskRewardRatio =
      riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
    // Breakeven win rate = 1 / (1 + R:R). At 1:2, BE = 33.3%. At 1:1, BE = 50%.
    const breakevenWinRate =
      riskRewardRatio > 0 ? (1 / (1 + riskRewardRatio)) * 100 : 0;
    return {
      riskRewardRatio,
      breakevenWinRate,
      riskPerShare,
      rewardPerShare,
    };
  },
  example: {
    title: "Worked example",
    inputs: { entryPrice: 100, stopLossPrice: 95, targetPrice: 115 },
    explanation:
      "You're buying at $100 with a stop at $95 (risk = $5/share) and a target at $115 (reward = $15/share). R:R = 15 ÷ 5 = 3.00, meaning you make $3 for every $1 risked. The breakeven win rate is 1 ÷ (1 + 3) = 25%. So even if you only win 1 in 4 trades, you break even — anything above 25% wins is profit. That's why traders chase high-R:R setups: the win-rate burden drops fast.",
  },
  faqs: [
    {
      q: "What's a good risk/reward ratio for trading?",
      a: "Most professional traders require a minimum 2:1 (you make $2 for every $1 risked). Below 2:1, you need a very high win rate to stay profitable after commissions and slippage. Setups offering 3:1 or better are where most retail traders should focus — they let you be wrong more often and still make money.",
    },
    {
      q: "What does 1:2 risk reward actually mean?",
      a: "1:2 means you risk $1 to potentially make $2. So a $100 risk targets a $200 reward. At 1:2, your breakeven win rate is 33.3% — win one out of every three trades and you don't lose money. Win more than 33.3% and you're profitable.",
    },
    {
      q: "How does R:R interact with win rate?",
      a: "R:R and win rate together determine profitability. The breakeven curve is: win_rate × reward = (1 − win_rate) × risk. A 70% win rate with 1:1 R:R is profitable; a 30% win rate with 1:3 R:R is also profitable. You don't need a high win rate if your R:R is high enough — and vice versa.",
    },
    {
      q: "Should I move my target if the trade is going well?",
      a: "Generally, no. The R:R you calculated at entry was based on your edge for THAT setup. Moving the target mid-trade is usually an emotional decision, not a statistical one. Better practice: define multiple scale-out levels at entry (e.g., sell 1/3 at 1:1, 1/3 at 1:2, hold rest with trailing stop), so target-management is rule-based.",
    },
    {
      q: "Does this work for short trades?",
      a: "Yes — the calculator uses absolute distance, so for a short trade where entry is $100, stop is $105 (above), and target is $90 (below), you'd input those values and the ratio still calculates correctly. The risk is the up-distance to your stop; the reward is the down-distance to your target.",
    },
    {
      q: "What R:R do top traders actually use?",
      a: "Studies of professional and prop-firm traders consistently show median R:R of 2:1 to 3:1 on closed winners, with win rates of 40-55%. The 'Holy Grail' combination is something like a 50% win rate at 2:1 R:R, which produces a +0.5R expectancy per trade — modest per-trade but powerful when compounded over hundreds of trades.",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
