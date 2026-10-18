"use client";

import { fmtPeso } from "@/lib/format";

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

const SIZE = 190;
const R = 72;
const STROKE = 30;
const C = 2 * Math.PI * R;

/** Donut chart: spending share by category. Hand-rolled SVG. */
export default function DonutChart({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;

  const segments = data.map((d) => {
    const frac = total > 0 ? d.value / total : 0;
    const seg = { ...d, dash: frac * C, offset: acc * C, frac };
    acc += frac;
    return seg;
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="Spending by category donut chart"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="#eef0fa"
            strokeWidth={STROKE}
          />
          {segments.map((s) =>
            s.frac > 0 ? (
              <circle
                key={s.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${s.dash} ${C - s.dash}`}
                strokeDashoffset={-s.offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                strokeLinecap="butt"
              />
            ) : null
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-brand-ink leading-none">
            {fmtPeso(total)}
          </span>
          <span className="text-[11px] text-slate-500 mt-1">spent</span>
        </div>
      </div>
      <ul className="w-full mt-4 space-y-1.5 max-h-44 overflow-y-auto nice-scroll pr-1">
        {segments.map((s) => (
          <li
            key={s.label}
            className="flex items-center gap-2 text-xs text-slate-600"
          >
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: s.color }}
            />
            <span className="flex-1 truncate">{s.label}</span>
            <span className="font-semibold text-slate-700">
              {Math.round(s.frac * 100)}%
            </span>
          </li>
        ))}
        {segments.length === 0 && (
          <li className="text-xs text-slate-400">No spending this month yet.</li>
        )}
      </ul>
    </div>
  );
}
