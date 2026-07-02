// Central registry of every calculator. Pages + sitemap + llms.txt read
// from this file so adding a new calculator means:
//   1. Create src/lib/calculators/<name>.ts exporting a CalculatorConfig
//   2. Import + add it here
// Everything else (sitemap entry, hub listing, schema) updates automatically.

import type { CalculatorConfig } from "./types";
import { positionSizeCalculator } from "./position-size";
import { kellyCriterionCalculator } from "./kelly-criterion";
import { stopLossCalculator } from "./stop-loss";
import { riskRewardRatioCalculator } from "./risk-reward-ratio";
import { tradingProfitCalculator } from "./trading-profit";
import { tradingRiskCalculator } from "./trading-risk";
import { futuresPositionSizeCalculator } from "./futures-position-size";
import { forexPositionSizeCalculator } from "./forex-position-size";

// Order intentional: highest-volume first so the hub page leads with
// the biggest opportunities, AND so any "most popular" UI cuts at top-N
// hit the right calculators.
export const calculators: CalculatorConfig[] = [
  positionSizeCalculator,         // 1,878 vol / KD 49 / TP 9,700
  kellyCriterionCalculator,       // 1,293 vol / KD 55 / TP 1,600
  forexPositionSizeCalculator,    //   579 vol / KD 56 / TP 9,800
  futuresPositionSizeCalculator,  //   225 vol / KD 38 / TP 3,500
  tradingRiskCalculator,          //   181 vol / KD 58 / TP 9,900
  stopLossCalculator,             //   173 vol / KD  2 / TP   200
  riskRewardRatioCalculator,      //   168 vol / KD 20 / TP   300
  tradingProfitCalculator,        //   126 vol / KD 37 / TP   300
];

export function getCalculatorBySlug(slug: string): CalculatorConfig | null {
  return calculators.find((c) => c.slug === slug) ?? null;
}
