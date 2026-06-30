"use client";

// Generic calculator renderer. Takes a calculator slug and looks up the
// full config (including the compute function) from the registry.
//
// Why slug instead of the full config object: the parent page is a
// Server Component, and Next.js can't serialize the `compute` function
// across the server→client boundary. Looking up by slug keeps all the
// non-serializable bits client-side.
//
// Inputs are controlled, computation runs on every change (calculators
// are O(1), no debounce needed). Outputs are formatted per their type.

import { useMemo, useState } from "react";
import type { CalculatorOutput } from "@/lib/calculators/types";
import { getCalculatorBySlug } from "@/lib/calculators/registry";

interface Props {
  slug: string;
}

export default function Calculator({ slug }: Props) {
  const config = getCalculatorBySlug(slug);

  // Hooks must run unconditionally — guard the body below.
  const initial = useMemo(
    () =>
      config
        ? Object.fromEntries(config.inputs.map((i) => [i.key, i.default]))
        : ({} as Record<string, number>),
    [config]
  );
  const [values, setValues] = useState<Record<string, number>>(initial);

  const outputs = useMemo(
    () => (config ? config.compute(values) : {}),
    [config, values]
  );

  if (!config) {
    return (
      <div className="my-8 p-6 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-sm">
        Calculator not found: <code>{slug}</code>
      </div>
    );
  }

  const reset = () =>
    setValues(Object.fromEntries(config.inputs.map((i) => [i.key, i.default])));

  return (
    <div className="my-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* Inputs */}
        <form
          className="lg:col-span-3 p-6 lg:p-8 bg-slate-50 space-y-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-navy">
              Your inputs
            </h2>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-primary hover:text-primary-dark"
            >
              Reset to defaults
            </button>
          </div>

          {config.inputs.map((input) => (
            <div key={input.key} className="space-y-1">
              <label
                htmlFor={`calc-${input.key}`}
                className="block text-sm font-medium text-slate-800"
              >
                {input.label}
              </label>
              <div className="flex items-stretch rounded-lg border border-slate-300 bg-white focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                {input.prefix && (
                  <span className="flex items-center px-3 text-sm text-slate-500 border-r border-slate-200">
                    {input.prefix}
                  </span>
                )}
                <input
                  id={`calc-${input.key}`}
                  type="number"
                  inputMode="decimal"
                  value={Number.isFinite(values[input.key]) ? values[input.key] : ""}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    setValues((v) => ({
                      ...v,
                      [input.key]: Number.isFinite(next) ? next : 0,
                    }));
                  }}
                  min={input.min}
                  max={input.max}
                  step={input.step ?? 1}
                  className="flex-1 px-3 py-2 text-base text-slate-900 bg-transparent outline-none"
                />
                {input.suffix && (
                  <span className="flex items-center px-3 text-sm text-slate-500 border-l border-slate-200">
                    {input.suffix}
                  </span>
                )}
              </div>
              {input.help && (
                <p className="text-xs text-slate-500 leading-snug">{input.help}</p>
              )}
            </div>
          ))}
        </form>

        {/* Outputs */}
        <div className="lg:col-span-2 p-6 lg:p-8 bg-gradient-to-br from-navy to-primary-dark text-white space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-primary-light">
            Results
          </h2>

          {config.outputs.map((output) => (
            <OutputCard key={output.key} output={output} value={outputs[output.key]} />
          ))}

          <p className="text-xs text-primary-light/80 leading-relaxed pt-2 border-t border-white/10">
            Results update live as you change inputs. This calculator runs entirely
            in your browser — your numbers are never sent to a server.
          </p>
        </div>
      </div>
    </div>
  );
}

function OutputCard({ output, value }: { output: CalculatorOutput; value: number }) {
  const isPrimary = !!output.primary;
  return (
    <div
      className={
        isPrimary
          ? "rounded-lg bg-white/10 backdrop-blur p-4 border border-white/20"
          : "py-2"
      }
    >
      <p className={`text-xs uppercase tracking-wide ${isPrimary ? "text-white/70" : "text-primary-light/70"}`}>
        {output.label}
      </p>
      <p className={`font-bold tabular-nums ${isPrimary ? "text-3xl text-white" : "text-xl text-primary-light"}`}>
        {formatValue(value, output.format)}
      </p>
      {output.hint && (
        <p className="text-xs text-white/60 leading-snug mt-1">{output.hint}</p>
      )}
    </div>
  );
}

function formatValue(value: number, format: CalculatorOutput["format"]): string {
  if (!Number.isFinite(value) || value === 0) {
    if (format === "ratio") return "—";
    if (format === "integer") return "0";
  }
  switch (format) {
    case "currency":
      return value.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
    case "percent":
      return `${value.toFixed(2)}%`;
    case "integer":
      return Math.floor(value).toLocaleString("en-US");
    case "ratio":
      return value > 0 ? `${value.toFixed(2)} : 1` : "—";
    case "number":
    default:
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}
