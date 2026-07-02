// Trading Profit Calculator config.
//
// Target keyword: "trading profit calculator"
// Ahrefs: 126 vol / KD 37 / Traffic Potential 300.

import type { CalculatorConfig } from "./types";

export const tradingProfitCalculator: CalculatorConfig = {
  slug: "trading-profit-calculator",
  title: "Trading Profit Calculator — Stock P/L in Dollars + Percent",
  metaDescription:
    "Free trading profit calculator. Enter your buy price, sell price, shares, and commissions — get your exact dollar profit, % return, and breakeven price.",
  focusKeyword: "trading profit calculator",
  secondaryKeywords: [
    "stock profit calculator",
    "trade pnl calculator",
    "trading return calculator",
    "stock gain loss calculator",
    "share profit calculator",
  ],
  intro:
    "A trading profit calculator turns a buy price, sell price, and share count into your exact P&L in dollars and percent. Add round-trip commissions and you get net profit too. We also compute the breakeven price (where you'd exit at zero P&L after commissions) — useful for setting tight scratch stops on tight trades.",
  inputs: [
    {
      key: "buyPrice",
      label: "Buy price",
      help: "Price you bought at (or your average cost basis).",
      type: "currency",
      default: 100,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "sellPrice",
      label: "Sell price",
      help: "Price you sold at (or the current price for an open position).",
      type: "currency",
      default: 110,
      min: 0.01,
      step: 0.01,
      prefix: "$",
    },
    {
      key: "shares",
      label: "Number of shares",
      help: "Share count for this position.",
      type: "number",
      default: 100,
      min: 1,
      step: 1,
      suffix: "shares",
    },
    {
      key: "commission",
      label: "Commission per side",
      help: "Cost per buy or sell. Most brokers (Robinhood, Fidelity, Schwab) charge $0 on US stocks. Enter 0 if commission-free.",
      type: "currency",
      default: 0,
      min: 0,
      step: 0.01,
      prefix: "$",
    },
  ],
  outputs: [
    {
      key: "netProfit",
      label: "Net profit / loss",
      format: "currency",
      hint: "After deducting round-trip commissions.",
      primary: true,
    },
    {
      key: "returnPercent",
      label: "Return on capital",
      format: "percent",
      hint: "Net P&L as a % of the position value.",
      primary: true,
    },
    {
      key: "grossProfit",
      label: "Gross profit / loss",
      format: "currency",
      hint: "Before commissions.",
    },
    {
      key: "totalCommissions",
      label: "Total commissions",
      format: "currency",
      hint: "Buy commission + sell commission combined.",
    },
    {
      key: "breakevenPrice",
      label: "Breakeven price",
      format: "currency",
      hint: "Sell price needed to net zero P&L after commissions.",
    },
  ],
  compute: ({ buyPrice, sellPrice, shares, commission }) => {
    const positionCost = buyPrice * shares;
    const grossProfit = (sellPrice - buyPrice) * shares;
    const totalCommissions = commission * 2; // buy + sell
    const netProfit = grossProfit - totalCommissions;
    const returnPercent =
      positionCost > 0 ? (netProfit / positionCost) * 100 : 0;
    const breakevenPrice =
      shares > 0 ? buyPrice + totalCommissions / shares : buyPrice;
    return {
      netProfit,
      returnPercent,
      grossProfit,
      totalCommissions,
      breakevenPrice,
    };
  },
  example: {
    title: "Worked example",
    inputs: { buyPrice: 100, sellPrice: 110, shares: 100, commission: 0 },
    explanation:
      "You bought 100 shares at $100 ($10,000 cost) and sold at $110. Gross profit = ($110 − $100) × 100 = $1,000. With commission-free trading (today's default on Robinhood, Fidelity, Schwab), net profit is also $1,000, which is a 10% return on the $10,000 capital deployed. If your broker charged $5 per side, you'd net $990 instead and your breakeven price would be $100.10.",
  },
  faqs: [
    {
      q: "What's the difference between gross profit and net profit?",
      a: "Gross profit is the raw (sell − buy) × shares math. Net profit subtracts costs — primarily commissions and SEC/regulatory fees. On commission-free brokers with US equities, gross and net are usually identical (or differ by a few pennies in SEC fees). On options or futures, the gap can be much wider.",
    },
    {
      q: "What return percentage is good for a single trade?",
      a: "It depends on your hold time. Day traders target 0.5-3% per trade. Swing traders target 5-20% per trade. Position traders may hold for months for 30-100%. What matters more is win rate × average win — a steady 5% per trade at 60% win rate beats sporadic 50% winners with frequent losers.",
    },
    {
      q: "How do I calculate profit on a short trade?",
      a: "Same formula but reversed: profit = (sell price − buy price) × shares. For shorts, you 'sell' first at a higher price and 'buy' to cover at a lower price. If you shorted at $100 and covered at $90 with 100 shares, gross profit = ($100 − $90) × 100 = $1,000. Enter the higher price as 'buy' and lower as 'sell' to make this calculator work for shorts.",
    },
    {
      q: "Does this account for taxes?",
      a: "No. Federal short-term capital gains are taxed at your ordinary income rate (10-37% in the US); long-term gains (held >1 year) at 0-20%. State taxes add on top. A rough rule for active traders: subtract 30-40% of net profit for federal+state taxes when planning. Always consult a CPA for exact treatment.",
    },
    {
      q: "What's the right commission to enter?",
      a: "For US stocks on Robinhood, Fidelity, Schwab, Webull, E*TRADE — $0. For Interactive Brokers Pro: ~$0.005/share with a $1 minimum. For options on most brokers: $0.65/contract. For international stocks or older brokers, check your statement. Use 0 if commission-free.",
    },
    {
      q: "How is return on capital different from return on risk?",
      a: "Return on capital = profit ÷ position value (the full $10k you deployed). Return on risk = profit ÷ amount at risk (just the $500 between entry and stop). Return on risk is much higher and more useful for comparing strategies — a 10% return on capital but 100% return on risk is excellent.",
    },
  ],
  relatedToolIds: ["tradezella", "tradervue"],
};
