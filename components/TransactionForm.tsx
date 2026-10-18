"use client";

import { useEffect, useState } from "react";
import type { Transaction, TxType } from "@/lib/types";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/types";
import { newId, todayISO } from "@/lib/store";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => void;
  initial?: Transaction | null;
}

interface Errors {
  amount?: string;
  date?: string;
  category?: string;
}

const inputCls =
  "w-full rounded-xl border border-brand-soft bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand";

/** Modal form for adding / editing a transaction, with validation. */
export default function TransactionForm({ open, onClose, onSave, initial }: Props) {
  const [txType, setTxType] = useState<TxType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setTxType(initial?.type ?? "expense");
      setAmount(initial ? String(initial.amount) : "");
      setDate(initial?.date ?? todayISO());
      setCategory(initial?.category ?? "");
      setNote(initial?.note ?? "");
      setErrors({});
    }
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const categories =
    txType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const validate = (): boolean => {
    const errs: Errors = {};
    const amt = parseFloat(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0)
      errs.amount = "Enter an amount greater than zero.";
    if (!date) errs.date = "Pick a date.";
    if (!category) errs.category = "Choose a category.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      id: initial?.id ?? newId(),
      date,
      amount: Math.round(parseFloat(amount) * 100) / 100,
      type: txType,
      category,
      note: note.trim(),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-brand-ink/45 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={initial ? "Edit transaction" : "Add transaction"}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="w-full max-w-md bg-paper rounded-2xl card-shadow p-6"
      >
        <h2 className="text-lg font-bold text-brand-ink mb-4">
          {initial ? "Edit transaction" : "Add transaction"}
        </h2>

        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-brand-faint mb-4">
          {(["expense", "income"] as TxType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTxType(t);
                setCategory("");
              }}
              className={`rounded-lg py-2 text-sm font-semibold capitalize transition-colors ${
                txType === t
                  ? t === "expense"
                    ? "bg-expense text-white"
                    : "bg-income text-white"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <label className="block mb-3">
          <span className="text-xs font-semibold text-slate-600">Amount (₱)</span>
          <input
            className={`${inputCls} mt-1`}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          {errors.amount && (
            <span className="text-xs text-expense mt-1 block">{errors.amount}</span>
          )}
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Date</span>
            <input
              className={`${inputCls} mt-1`}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {errors.date && (
              <span className="text-xs text-expense mt-1 block">{errors.date}</span>
            )}
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Category</span>
            <select
              className={`${inputCls} mt-1`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select…</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <span className="text-xs text-expense mt-1 block">
                {errors.category}
              </span>
            )}
          </label>
        </div>

        <label className="block mb-5">
          <span className="text-xs font-semibold text-slate-600">
            Note <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <input
            className={`${inputCls} mt-1`}
            type="text"
            maxLength={120}
            placeholder="What was this for?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-brand-faint transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-deep transition-colors"
          >
            {initial ? "Save changes" : "Add transaction"}
          </button>
        </div>
      </form>
    </div>
  );
}
