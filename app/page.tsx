"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BentoCard from "@/components/BentoCard";
import BarChart, { type MonthDatum } from "@/components/BarChart";
import DonutChart, { type DonutDatum } from "@/components/DonutChart";
import BudgetBar from "@/components/BudgetBar";
import TransactionForm from "@/components/TransactionForm";
import { useFinance, txsForMonth, sumByType } from "@/lib/store";
import { categoryColor, type Transaction } from "@/lib/types";
import {
  fmtPeso,
  fmtDate,
  monthKey,
  monthLabel,
  lastNMonths,
} from "@/lib/format";
import { downloadCSV } from "@/lib/csv";

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone: "brand" | "income" | "expense";
}) {
  const tones = {
    brand: "text-brand",
    income: "text-income",
    expense: "text-expense",
  } as const;
  return (
    <BentoCard className="card-shadow-hover transition-shadow">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold mt-1 ${tones[tone]}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </BentoCard>
  );
}

export default function Dashboard() {
  const { state, dispatch, resetDemo } = useFinance();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const nowKey = monthKey(new Date());
  const monthTxs = useMemo(
    () => txsForMonth(state.transactions, nowKey),
    [state.transactions, nowKey]
  );

  const balance = useMemo(
    () =>
      sumByType(state.transactions, "income") -
      sumByType(state.transactions, "expense"),
    [state.transactions]
  );
  const mIncome = useMemo(() => sumByType(monthTxs, "income"), [monthTxs]);
  const mExpense = useMemo(() => sumByType(monthTxs, "expense"), [monthTxs]);
  const savingsRate =
    mIncome > 0 ? Math.max(0, ((mIncome - mExpense) / mIncome) * 100) : 0;

  const barData: MonthDatum[] = useMemo(
    () =>
      lastNMonths(6).map((k) => {
        const txs = txsForMonth(state.transactions, k);
        return {
          key: k,
          income: sumByType(txs, "income"),
          expense: sumByType(txs, "expense"),
        };
      }),
    [state.transactions]
  );

  const donutData: DonutDatum[] = useMemo(() => {
    const byCat = new Map<string, number>();
    for (const t of monthTxs) {
      if (t.type !== "expense") continue;
      byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
    }
    return [...byCat.entries()]
      .map(([label, value]) => ({ label, value, color: categoryColor(label) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [monthTxs]);

  const recent = useMemo(() => monthTxs.slice(0, 5), [monthTxs]);

  const budgetRows = useMemo(
    () =>
      state.budgets.map((b) => ({
        ...b,
        spent: monthTxs
          .filter((t) => t.type === "expense" && t.category === b.category)
          .reduce((s, t) => s + t.amount, 0),
      })),
    [state.budgets, monthTxs]
  );

  const saveTx = (tx: Transaction) => {
    dispatch(editing ? { type: "UPDATE_TX", tx } : { type: "ADD_TX", tx });
    setEditing(null);
  };

  const confirmReset = () => {
    if (
      window.confirm(
        "Reset all data back to the demo dataset? Your changes will be lost."
      )
    ) {
      resetDemo();
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {monthLabel(nowKey)} · all figures in Philippine peso
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(state.transactions)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-brand-deep bg-brand-soft hover:bg-brand-faint transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-colors"
          >
            + Add transaction
          </button>
        </div>
      </div>

      {state.transactions.length === 0 ? (
        <BentoCard
          title="Welcome to SpendWise"
          subtitle="Your personal finance dashboard"
          className="items-center text-center py-12"
        >
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            No transactions yet. Add your first income or expense to start
            seeing charts, budgets, and your savings rate.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-colors"
          >
            Add your first transaction
          </button>
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <StatCard
              label="Total balance"
              value={fmtPeso(balance)}
              sub={`${savingsRate.toFixed(0)}% saved this month`}
              tone="brand"
            />
          </div>
          <div className="md:col-span-2">
            <StatCard
              label={`Income · ${monthLabel(nowKey)}`}
              value={fmtPeso(mIncome)}
              tone="income"
            />
          </div>
          <div className="md:col-span-2">
            <StatCard
              label={`Expenses · ${monthLabel(nowKey)}`}
              value={fmtPeso(mExpense)}
              tone="expense"
            />
          </div>

          <div className="md:col-span-4">
            <BentoCard title="Income vs expenses" subtitle="Last 6 months">
              <BarChart data={barData} />
            </BentoCard>
          </div>
          <div className="md:col-span-2">
            <BentoCard title="Spending by category" subtitle={monthLabel(nowKey)}>
              <DonutChart data={donutData} />
            </BentoCard>
          </div>

          <div className="md:col-span-4">
            <BentoCard
              title="Recent transactions"
              subtitle="This month"
              action={
                <Link
                  href="/transactions"
                  className="text-xs font-semibold text-brand hover:text-brand-deep"
                >
                  View all →
                </Link>
              }
            >
              {recent.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  Nothing recorded this month yet.
                </p>
              ) : (
                <ul className="divide-y divide-brand-soft/70">
                  {recent.map((t) => (
                    <li key={t.id} className="py-2.5 flex items-center gap-3">
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                        style={{
                          background: `${categoryColor(t.category)}1a`,
                          color: categoryColor(t.category),
                        }}
                      >
                        {t.category.charAt(0)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {t.note || t.category}
                        </p>
                        <p className="text-xs text-slate-400">
                          {t.category} · {fmtDate(t.date)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold shrink-0 ${
                          t.type === "income" ? "text-income" : "text-expense"
                        }`}
                      >
                        {t.type === "income" ? "+" : "−"}
                        {fmtPeso(t.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </BentoCard>
          </div>
          <div className="md:col-span-2">
            <BentoCard
              title="Budgets"
              subtitle={monthLabel(nowKey)}
              action={
                <Link
                  href="/budgets"
                  className="text-xs font-semibold text-brand hover:text-brand-deep"
                >
                  Manage →
                </Link>
              }
            >
              {budgetRows.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">
                  No budgets set.{" "}
                  <Link href="/budgets" className="text-brand font-semibold">
                    Create one
                  </Link>
                </p>
              ) : (
                <div className="divide-y divide-brand-soft/60">
                  {budgetRows.slice(0, 4).map((b) => (
                    <BudgetBar
                      key={b.category}
                      category={b.category}
                      spent={b.spent}
                      limit={b.limit}
                      color={categoryColor(b.category)}
                    />
                  ))}
                </div>
              )}
            </BentoCard>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={confirmReset}
          className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
        >
          Reset demo data
        </button>
      </div>

      <TransactionForm
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSave={saveTx}
      />
    </div>
  );
}
