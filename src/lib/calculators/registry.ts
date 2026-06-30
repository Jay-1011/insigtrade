// Central registry of every calculator. Pages + sitemap + llms.txt read
// from this file so adding a new calculator means:
//   1. Create src/lib/calculators/<name>.ts exporting a CalculatorConfig
//   2. Import + add it here
// Everything else (sitemap entry, hub listing, schema) updates automatically.

import type { CalculatorConfig } from "./types";
import { positionSizeCalculator } from "./position-size";
import { kellyCriterionCalculator } from "./kelly-criterion";

export const calculators: CalculatorConfig[] = [
  positionSizeCalculator,
  kellyCriterionCalculator,
  // Coming next (data-driven priority order):
  //   forex-position-size-calculator    — 579 vol, KD 56, TP 9,800
  //   futures-position-size-calculator  — 225 vol, KD 38, TP 3,500
  //   trading-risk-calculator           — 181 vol, KD 58, TP 9,900
  //   stop-loss-calculator              — 173 vol, KD 2,  TP 200
  //   risk-reward-ratio-calculator      — 168 vol, KD 20, TP 300
  //   trading-profit-calculator         — 126 vol, KD 37, TP 300
];

export function getCalculatorBySlug(slug: string): CalculatorConfig | null {
  return calculators.find((c) => c.slug === slug) ?? null;
}
