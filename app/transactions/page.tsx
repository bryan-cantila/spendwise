"use client";

import { useMemo, useState } from "react";
import BentoCard from "@/components/BentoCard";
import TransactionForm from "@/components/TransactionForm";
import { useFinance } from "@/lib/store";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  categoryColor,
  type Transaction,
} from "@/lib/types";
import { fmtPeso, fmtDate } from "@/lib/format";
import { downloadCSV } from "@/lib/csv";

type SortKey = "date-desc" | "date-asc" | "amount-desc" | "amount-asc";

const ALL_CATEGORIES = [
  ...EXPENSE_CATEGORIES.map((c) => c.name),
  ...INCOME_CATEGORIES.map((c) => c.name),
].filter((v, i, a) => a.indexOf(v) === i);

const selectCls =
  "rounded-xl border border-brand-soft bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand/40";

export default function TransactionsPage() {
  const { state, dispatch } = useFinance();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [sort, setSort] = useState<SortKey>("date-desc");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = state.transactions.filter((t) => {
      if (catFilter && t.category !== catFilter) return false;
      if (typeFilter && t.type !== typeFilter) return false;
      if (
        q &&
        !`${t.note} ${t.category} ${t.amount}`.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "date-asc":
          return a.date.localeCompare(b.date);
        case "amount-desc":
          return b.amount - a.amount;
        case "amount-asc":
          return a.amount - b.amount;
        default:
          return b.date.localeCompare(a.date);
      }
    });
    return list;
  }, [state.transactions, query, catFilter, typeFilter, sort]);

  const saveTx = (tx: Transaction) => {
    dispatch(editing ? { type: "UPDATE_TX", tx } : { type: "ADD_TX", tx });
    setEditing(null);
  };

  const askDelete = (t: Transaction) => {
    if (
      window.confirm(
        `Delete this ${t.type} of ${fmtPeso(t.amount)} (${t.note || t.category})?`
      )
    ) {
      dispatch({ type: "DELETE_TX", id: t.id });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink tracking-tight">
            Transactions
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} of {state.transactions.length} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCSV(filtered)}
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

      <BentoCard className="mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <input
            type="search"
            placeholder="Search notes, category, amount…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${selectCls} col-span-2`}
            aria-label="Search transactions"
          />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className={selectCls}
            aria-label="Filter by category"
          >
            <option value="">All categories</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "" | "income" | "expense")}
            className={selectCls}
            aria-label="Filter by type"
          >
            <option value="">Income + expenses</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className={selectCls}
            aria-label="Sort transactions"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="amount-desc">Largest amount</option>
            <option value="amount-asc">Smallest amount</option>
          </select>
        </div>
      </BentoCard>

      <BentoCard>
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="text-sm font-semibold text-slate-600 mb-1">
              No transactions match
            </p>
            <p className="text-sm text-slate-400 mb-5">
              {state.transactions.length === 0
                ? "Add your first transaction to get started."
                : "Try clearing the search or filters."}
            </p>
            {(query || catFilter || typeFilter) && (
              <button
                onClick={() => {
                  setQuery("");
                  setCatFilter("");
                  setTypeFilter("");
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-deep bg-brand-soft hover:bg-brand-faint transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto nice-scroll -mx-5 px-5">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-brand-soft">
                  <th className="py-2.5 pr-3 font-semibold">Date</th>
                  <th className="py-2.5 pr-3 font-semibold">Description</th>
                  <th className="py-2.5 pr-3 font-semibold">Category</th>
                  <th className="py-2.5 pr-3 font-semibold text-right">Amount</th>
                  <th className="py-2.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-soft/60">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-brand-faint/60">
                    <td className="py-3 pr-3 text-slate-500 whitespace-nowrap">
                      {fmtDate(t.date)}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="font-medium text-slate-700">
                        {t.note || "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          background: `${categoryColor(t.category)}1a`,
                          color: categoryColor(t.category),
                        }}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td
                      className={`py-3 pr-3 text-right font-bold whitespace-nowrap ${
                        t.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {t.type === "income" ? "+" : "−"}
                      {fmtPeso(t.amount)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditing(t);
                          setFormOpen(true);
                        }}
                        className="text-xs font-semibold text-brand hover:text-brand-deep px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => askDelete(t)}
                        className="text-xs font-semibold text-expense hover:opacity-80 px-2 py-1"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </BentoCard>

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
