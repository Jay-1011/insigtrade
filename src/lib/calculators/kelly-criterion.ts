// Kelly Criterion Calculator config.
//
// Target keyword: "kelly criterion calculator"
// Ahrefs: 1,293 vol / KD 55 / Traffic Potential 1,600 / no AI Overview.
//
// Kelly's formula (for binary win/loss outcomes):
//   f* = W − ((1 − W) / R)
// where:
//   W = win probability (decimal, 0-1)
//   R = win/loss ratio = average win amount / average loss amount
//
// Practical reality: full Kelly is too volatile for most traders, so we
// surface half-Kelly + quarter-Kelly as "safer" alternatives. This is the
// industry-standard treatment and matches what Trade Ideas, Edgewonk,
// and most prop desks teach.

import type { CalculatorConfig } from "./types";

export const kellyCriterionCalculator: CalculatorConfig = {
  slug: "kelly-criterion-calculator",
  title: "Kelly Criterion Calculator (with Half & Quarter Kelly)",
  metaDescription:
    "Free Kelly Criterion calculator. Enter your win rate, avg win, avg loss — get the mathematically optimal position size + safer half-Kelly and quarter-Kelly fractions.",
  focusKeyword: "kelly criterion calculator",
  secondaryKeywords: [
    "kelly formula calculator",
    "kelly criterion for trading",
    "half kelly position sizing",
    "kelly bet size calculator",
    "optimal position size formula",
  ],
  intro:
    "The Kelly Criterion tells you the mathematically optimal fraction of your account to risk on each trade. Enter your win rate and average win/loss size — we'll calculate the full Kelly percentage, the more conservative half-Kelly and quarter-Kelly fractions most pros actually use, and your recommended dollar risk per trade. The formula is f = W − ((1 − W) ÷ R).",
  inputs: [
    {
      key: "winRate",
      label: "Win rate",
      help: "Percentage of trades that finish profitable. Be honest — most retail strategies are 40-55%.",
      type: "percent",
      default: 55,
      min: 0,
      max: 100,
      step: 0.5,
      suffix: "%",
    },
    {
      key: "avgWin",
      label: "Average win",
      help: "Average $ amount you make on winning trades (or any unit — we use the ratio, not the absolute number).",
      type: "currency",
      default: 200,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "avgLoss",
      label: "Average loss",
      help: "Average $ amount you lose on losing trades. Enter as a positive number.",
      type: "currency",
      default: 100,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "accountSize",
      label: "Account size (optional)",
      help: "Total trading capital. Enter 0 to skip the dollar-risk outputs.",
      type: "currency",
      default: 25000,
      min: 0,
      step: 100,
      prefix: "$",
    },
  ],
  outputs: [
    {
      key: "kellyFraction",
      label: "Kelly fraction",
      format: "percent",
      hint: "The mathematically optimal % of account to risk per trade. Theoretical maximum growth rate.",
      primary: true,
    },
    {
      key: "halfKelly",
      label: "Half-Kelly",
      format: "percent",
      hint: "What most pros actually use — same expected return, ~75% less drawdown variance.",
      primary: true,
    },
    {
      key: "quarterKelly",
      label: "Quarter-Kelly",
      format: "percent",
      hint: "Conservative. Slower growth but psychologically survivable during losing streaks.",
    },
    {
      key: "kellyDollars",
      label: "Recommended risk per trade (full Kelly)",
      format: "currency",
      hint: "Based on your account size + full Kelly fraction.",
    },
    {
      key: "halfKellyDollars",
      label: "Recommended risk per trade (half-Kelly)",
      format: "currency",
      hint: "The more livable number for most retail traders.",
    },
    {
      key: "expectedValuePerTrade",
      label: "Expected value per trade",
      format: "currency",
      hint: "Avg per-trade profit at half-Kelly sizing. Negative = your edge is too thin to size up.",
    },
  ],
  compute: ({ winRate, avgWin, avgLoss, accountSize }) => {
    // Normalize percent → decimal
    const W = winRate / 100;
    const L = 1 - W;
    const R = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Kelly formula. Clamp at 0 — a negative Kelly means you have negative
    // edge and should not be trading the strategy at all.
    const rawKelly = R > 0 ? W - L / R : 0;
    const kelly = Math.max(0, rawKelly);

    const halfKelly = kelly / 2;
    const quarterKelly = kelly / 4;

    const kellyDollars = accountSize > 0 ? (accountSize * kelly) : 0;
    const halfKellyDollars = accountSize > 0 ? (accountSize * halfKelly) : 0;

    // Expected value per trade at half-Kelly sizing
    const expectedValuePerTrade =
      accountSize > 0
        ? (W * (halfKellyDollars * R) - L * halfKellyDollars)
        : 0;

    return {
      kellyFraction: kelly * 100, // back to percent for display
      halfKelly: halfKelly * 100,
      quarterKelly: quarterKelly * 100,
      kellyDollars,
      halfKellyDollars,
      expectedValuePerTrade,
    };
  },
  example: {
    title: "Worked example",
    inputs: {
      winRate: 55,
      avgWin: 200,
      avgLoss: 100,
      accountSize: 25000,
    },
    explanation:
      "You win 55% of the time, your average winner is $200, your average loser is $100. Win/loss ratio R = 2. Plugging in: Kelly = 0.55 − (0.45 ÷ 2) = 0.325 = 32.5%. That's the theoretical max — but full Kelly is brutally volatile (you'd routinely see 50%+ drawdowns). Half-Kelly = 16.25% is what most pros use: same long-run expected return, far smaller drawdowns. At a $25,000 account, half-Kelly means risking ~$4,062 per trade.",
  },
  faqs: [
    {
      q: "What is the Kelly Criterion?",
      a: "The Kelly Criterion is a formula developed by John Kelly at Bell Labs in 1956 that tells you the mathematically optimal fraction of your bankroll to bet (or risk on a trade) to maximize long-term geometric growth. It accounts for both your edge (win rate) and your odds (win/loss ratio).",
    },
    {
      q: "Why do most traders use half-Kelly instead of full Kelly?",
      a: "Full Kelly maximizes expected growth but also maximizes volatility. It routinely produces 50%+ drawdowns that are psychologically (and often financially) unsurvivable. Half-Kelly captures about 75% of full Kelly's expected return with roughly 25% of the variance — a much better risk-adjusted outcome for most traders.",
    },
    {
      q: "What if Kelly tells me to risk 50% of my account per trade?",
      a: "That means your inputs are either very optimistic or your edge is genuinely huge. In practice, never risk more than 1-2% of your account per trade regardless of what Kelly says — even half-Kelly on a great strategy rarely exceeds 5%. Use Kelly as a directional signal (am I undersizing?), not an absolute prescription.",
    },
    {
      q: "What if my Kelly result is 0% or negative?",
      a: "A 0% or negative Kelly means your win rate and win/loss ratio combine to give you no statistical edge — you'd lose money in the long run trading this strategy. Either your inputs are wrong (small sample size?), or the strategy isn't profitable and you should stop trading it.",
    },
    {
      q: "Should I use Kelly for swing trades, day trades, or both?",
      a: "Kelly works for any series of binary win/loss bets, including both swing and day trades — but only if your inputs are reliable. You need at least 30-50 closed trades to have a meaningful win rate estimate, and your avg win / avg loss should be measured on similar setup types, not pooled across strategies.",
    },
    {
      q: "How is Kelly different from fixed-percent position sizing?",
      a: "Fixed-percent (e.g., 'always risk 1%') treats every trade as equally important. Kelly adjusts position size based on your statistical edge — bigger when your edge is bigger, smaller (or zero) when it isn't. Kelly is more aggressive when you have a real edge and more defensive when you don't, but it requires accurate inputs.",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
