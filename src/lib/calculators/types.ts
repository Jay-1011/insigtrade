// Shared types for the Insigtrade calculator hub.
//
// Each calculator is just a config object: inputs (form fields), a pure
// compute() function, and result-rendering metadata. The Calculator
// React component takes the config + handles state, validation, output.
//
// AEO/GEO note: these pages are interactive, so they're immune to AI
// Overview cannibalization. Per the Ahrefs research (Jun 2026), this
// is the biggest underexploited content type for our niche.

export type CalculatorInputType = "number" | "currency" | "percent";

export interface CalculatorInput {
  /** Internal key used in form state + compute() args */
  key: string;
  label: string;
  help?: string;
  type: CalculatorInputType;
  /** Default value shown when the page loads */
  default: number;
  min?: number;
  max?: number;
  /** Step for the number input */
  step?: number;
  /** Optional suffix shown after the value, e.g. "%" or "shares" */
  suffix?: string;
  /** Optional prefix, e.g. "$" */
  prefix?: string;
}

export interface CalculatorOutput {
  key: string;
  label: string;
  /** How to format the computed number */
  format: "currency" | "percent" | "number" | "integer" | "ratio";
  /** Marketing/explanatory text shown under the value */
  hint?: string;
  /** Optional: highlight this output as the primary takeaway */
  primary?: boolean;
}

export interface CalculatorConfig {
  slug: string;
  /** H1 + meta title; aim for 55-65 chars, focus keyword early */
  title: string;
  /** Meta description, 140-160 chars */
  metaDescription: string;
  /** Focus keyword for SEO + schema keywords field */
  focusKeyword: string;
  secondaryKeywords?: string[];
  /** 40-60 word direct-answer paragraph shown at top */
  intro: string;
  inputs: CalculatorInput[];
  outputs: CalculatorOutput[];
  /**
   * Pure function: takes the inputs by key, returns outputs by key.
   * Should be deterministic + handle bad inputs (NaN, 0) gracefully.
   */
  compute: (inputs: Record<string, number>) => Record<string, number>;
  /** Worked example for the "how to use this" section */
  example: {
    title: string;
    inputs: Record<string, number>;
    explanation: string;
  };
  /** PAA-targeting FAQ at the bottom */
  faqs: { q: string; a: string }[];
  /** Optional: which Insigtrade tools to upsell on this page */
  relatedToolIds?: string[];
}
