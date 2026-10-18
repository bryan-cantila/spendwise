"use client";

import { useMemo, useState } from "react";
import BentoCard from "@/components/BentoCard";
import BudgetBar from "@/components/BudgetBar";
import { useFinance, txsForMonth } from "@/lib/store";
import { EXPENSE_CATEGORIES, categoryColor } from "@/lib/types";
import { fmtPeso, monthKey, monthLabel } from "@/lib/format";

const inputCls =
  "w-full rounded-xl border border-brand-soft bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";

export default function BudgetsPage() {
  const { state, dispatch } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0].name);
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  const nowKey = monthKey(new Date());
  const monthTxs = useMemo(
    () => txsForMonth(state.transactions, nowKey),
    [state.transactions, nowKey]
  );

  const rows = useMemo(
    () =>
      [...state.budgets]
        .sort((a, b) => a.category.localeCompare(b.category))
        .map((b) => ({
          ...b,
          spent: monthTxs
            .filter((t) => t.type === "expense" && t.category === b.category)
            .reduce((s, t) => s + t.amount, 0),
        })),
    [state.budgets, monthTxs]
  );

  const totalBudget = rows.reduce((s, r) => s + r.limit, 0);
  const totalSpent = rows.reduce((s, r) => s + Math.min(r.spent, r.limit), 0);

  const openAdd = () => {
    setEditingCat(null);
    const used = new Set(state.budgets.map((b) => b.category));
    const firstFree =
      EXPENSE_CATEGORIES.find((c) => !used.has(c.name))?.name ??
      EXPENSE_CATEGORIES[0].name;
    setCategory(firstFree);
    setLimit("");
    setError("");
    setModalOpen(true);
  };

  const openEdit = (cat: string, currentLimit: number) => {
    setEditingCat(cat);
    setCategory(cat);
    setLimit(String(currentLimit));
    setError("");
    setModalOpen(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(limit);
    if (!limit || Number.isNaN(amt) || amt <= 0) {
      setError("Enter a limit greater than zero.");
      return;
    }
    dispatch({
      type: "SET_BUDGET",
      budget: { category, limit: Math.round(amt * 100) / 100 },
    });
    setModalOpen(false);
  };

  const askDelete = (cat: string) => {
    if (window.confirm(`Remove the budget for "${cat}"?`)) {
      dispatch({ type: "DELETE_BUDGET", category: cat });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight">
            Budgets
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monthly spending limits · {monthLabel(nowKey)}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-colors"
        >
          + Add budget
        </button>
      </div>

      {rows.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <BentoCard className="card-shadow-hover transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total budgeted
            </p>
            <p className="text-2xl font-bold text-brand mt-1">
              {fmtPeso(totalBudget)}
            </p>
          </BentoCard>
          <BentoCard className="card-shadow-hover transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Spent of budget
            </p>
            <p className="text-2xl font-bold text-expense mt-1">
              {fmtPeso(rows.reduce((s, r) => s + r.spent, 0))}
            </p>
          </BentoCard>
          <BentoCard className="card-shadow-hover transition-shadow">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categories on track
            </p>
            <p className="text-2xl font-bold text-income mt-1">
              {rows.filter((r) => r.spent <= r.limit).length} / {rows.length}
            </p>
          </BentoCard>
        </div>
      )}

      <BentoCard
        title="Category budgets"
        subtitle={
          rows.length > 0
            ? "Progress resets on the 1st of each month"
            : undefined
        }
      >
        {rows.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-slate-600 mb-1">
              No budgets yet
            </p>
            <p className="text-sm text-slate-400 mb-5 max-w-sm mx-auto">
              Set a monthly limit per category — for example ₱6,000 for Food
              &amp; Dining — and watch the bar fill as you spend.
            </p>
            <button
              onClick={openAdd}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-colors"
            >
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            {rows.map((r) => (
              <div
                key={r.category}
                className="border-b border-brand-soft/60 last:border-0 py-1"
              >
                <BudgetBar
                  category={r.category}
                  spent={r.spent}
                  limit={r.limit}
                  color={categoryColor(r.category)}
                />
                <div className="flex justify-end gap-1 -mt-1 mb-2">
                  <button
                    onClick={() => openEdit(r.category, r.limit)}
                    className="text-xs font-semibold text-brand hover:text-brand-deep px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => askDelete(r.category)}
                    className="text-xs font-semibold text-expense hover:opacity-80 px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-brand-ink/45 p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={editingCat ? "Edit budget" : "Add budget"}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-md bg-paper rounded-2xl card-shadow p-6"
          >
            <h2 className="text-lg font-bold text-brand-ink mb-4">
              {editingCat ? `Edit budget · ${editingCat}` : "Add budget"}
            </h2>
            {!editingCat && (
              <label className="block mb-3">
                <span className="text-xs font-semibold text-slate-600">
                  Category
                </span>
                <select
                  className={`${inputCls} mt-1`}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option
                      key={c.name}
                      value={c.name}
                      disabled={state.budgets.some((b) => b.category === c.name)}
                    >
                      {c.name}
                      {state.budgets.some((b) => b.category === c.name)
                        ? " (already set)"
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="block mb-5">
              <span className="text-xs font-semibold text-slate-600">
                Monthly limit (₱)
              </span>
              <input
                className={`${inputCls} mt-1`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="5000"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
              {error && (
                <span className="text-xs text-expense mt-1 block">{error}</span>
              )}
            </label>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-brand-faint transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-colors"
              >
                {editingCat ? "Save changes" : "Add budget"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
