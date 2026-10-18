"use client";

import { fmtPesoCompact, monthShort } from "@/lib/format";

export interface MonthDatum {
  key: string;
  income: number;
  expense: number;
}

const W = 620;
const H = 250;
const PAD_L = 52;
const PAD_R = 10;
const PAD_T = 14;
const PAD_B = 30;

const INCOME_FILL = "#263baa";
const EXPENSE_FILL = "#e8890c";

/** Grouped bar chart: income vs expense per month. Hand-rolled SVG. */
export default function BarChart({ data }: { data: MonthDatum[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  // Round the top gridline up to a nice value
  const top = Math.ceil(max / 20000) * 20000;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const y = (v: number) => PAD_T + innerH - (v / top) * innerH;

  const groupW = innerW / Math.max(1, data.length);
  const barW = Math.min(26, groupW * 0.28);
  const gridlines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        role="img"
        aria-label="Monthly income versus expenses bar chart"
      >
        {gridlines.map((g) => (
          <g key={g}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={y(top * g)}
              y2={y(top * g)}
              stroke="#e3e7f7"
              strokeWidth={1}
              strokeDasharray={g === 0 ? "" : "4 4"}
            />
            <text
              x={PAD_L - 8}
              y={y(top * g) + 4}
              textAnchor="end"
              fontSize={11}
              fill="#7a84a6"
            >
              {fmtPesoCompact(top * g)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = PAD_L + groupW * i + groupW / 2;
          const ih = innerH * (d.income / top);
          const eh = innerH * (d.expense / top);
          return (
            <g key={d.key}>
              <rect
                x={cx - barW - 3}
                y={y(d.income)}
                width={barW}
                height={Math.max(0, ih)}
                rx={4}
                fill={INCOME_FILL}
              />
              <rect
                x={cx + 3}
                y={y(d.expense)}
                width={barW}
                height={Math.max(0, eh)}
                rx={4}
                fill={EXPENSE_FILL}
              />
              <text
                x={cx}
                y={H - 10}
                textAnchor="middle"
                fontSize={12}
                fontWeight={600}
                fill="#4a5478"
              >
                {monthShort(d.key)}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-5 mt-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: INCOME_FILL }}
          />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: EXPENSE_FILL }}
          />
          Expenses
        </span>
      </div>
    </div>
  );
}
