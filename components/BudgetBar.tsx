"use client";

import { fmtPeso } from "@/lib/format";

interface Props {
  category: string;
  spent: number;
  limit: number;
  color: string;
}

/** Budget progress bar: indigo -> amber -> red as the limit is approached. */
export default function BudgetBar({ category, spent, limit, color }: Props) {
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = spent > limit;
  const barColor = over ? "#e03131" : pct >= 75 ? "#dd7e0a" : "#263baa";
  const remaining = limit - spent;

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 min-w-0">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: color }}
          />
          <span className="truncate">{category}</span>
        </span>
        <span className="text-xs text-slate-500 shrink-0">
          <span className={`font-semibold ${over ? "text-expense" : "text-slate-700"}`}>
            {fmtPeso(spent)}
          </span>{" "}
          / {fmtPeso(limit)}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-brand-faint overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      <p className="text-[11px] mt-1 text-slate-500">
        {over ? (
          <span className="text-expense font-medium">
            {fmtPeso(-remaining)} over budget
          </span>
        ) : (
          <span>{fmtPeso(remaining)} left</span>
        )}{" "}
        · {Math.round(pct)}%
      </p>
    </div>
  );
}
