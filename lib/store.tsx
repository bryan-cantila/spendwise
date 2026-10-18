"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Budget, FinanceState, Transaction } from "./types";
import { monthKey, toISODate } from "./format";

const STORAGE_KEY = "spendwise_v1";

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

type Action =
  | { type: "ADD_TX"; tx: Transaction }
  | { type: "UPDATE_TX"; tx: Transaction }
  | { type: "DELETE_TX"; id: string }
  | { type: "SET_BUDGET"; budget: Budget }
  | { type: "DELETE_BUDGET"; category: string }
  | { type: "RESET" };

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case "ADD_TX":
      return {
        ...state,
        transactions: [action.tx, ...state.transactions].sort((a, b) =>
          b.date.localeCompare(a.date)
        ),
      };
    case "UPDATE_TX":
      return {
        ...state,
        transactions: state.transactions
          .map((t) => (t.id === action.tx.id ? action.tx : t))
          .sort((a, b) => b.date.localeCompare(a.date)),
      };
    case "DELETE_TX":
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.id),
      };
    case "SET_BUDGET": {
      const rest = state.budgets.filter(
        (b) => b.category !== action.budget.category
      );
      return { ...state, budgets: [...rest, action.budget] };
    }
    case "DELETE_BUDGET":
      return {
        ...state,
        budgets: state.budgets.filter((b) => b.category !== action.category),
      };
    case "RESET":
      return seedState();
  }
}

/* ------------------------------------------------------------------ */
/* Deterministic demo data                                             */
/* ------------------------------------------------------------------ */

/** mulberry32 — deterministic PRNG so demo data is stable per load */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idCounter = 0;
function uid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

interface SeedSpec {
  day: number;
  amount: [number, number];
  category: string;
  note: string;
  txType: "income" | "expense";
  chance?: number;
}

const MONTHLY_BILLS: SeedSpec[] = [
  { day: 5, amount: [8000, 8000], category: "Housing", note: "Monthly rent", txType: "expense" },
  { day: 8, amount: [2800, 4200], category: "Utilities", note: "Electric + water + internet", txType: "expense" },
  { day: 15, amount: [28500, 28500], category: "Salary", note: "Payroll — 1st half", txType: "income" },
  { day: 30, amount: [28500, 28500], category: "Salary", note: "Payroll — 2nd half", txType: "income" },
];

const RECURRING: SeedSpec[] = [
  { day: 3, amount: [1800, 3400], category: "Groceries", note: "Weekly grocery run", txType: "expense", chance: 0.9 },
  { day: 10, amount: [1800, 3400], category: "Groceries", note: "Weekly grocery run", txType: "expense", chance: 0.9 },
  { day: 17, amount: [1800, 3400], category: "Groceries", note: "Weekly grocery run", txType: "expense", chance: 0.9 },
  { day: 24, amount: [1800, 3400], category: "Groceries", note: "Weekly grocery run", txType: "expense", chance: 0.9 },
  { day: 7, amount: [3000, 9000], category: "Freelance", note: "Side project payout", txType: "income", chance: 0.55 },
  { day: 21, amount: [3000, 9000], category: "Freelance", note: "Consulting gig", txType: "income", chance: 0.45 },
  { day: 12, amount: [4000, 7000], category: "Savings", note: "Monthly savings transfer", txType: "expense", chance: 0.85 },
];

const SMALL_EXPENSES: { category: string; notes: string[]; amount: [number, number]; perMonth: number }[] = [
  { category: "Food & Dining", notes: ["Lunch with colleagues", "Dinner delivery", "Coffee and snacks", "Weekend brunch"], amount: [180, 750], perMonth: 9 },
  { category: "Transport", notes: ["Grab ride", "Jeepney + tricycle", "Gas refill", "Parking fee"], amount: [120, 600], perMonth: 8 },
  { category: "Shopping", notes: ["Online order", "Clothes", "Gadgets accessories", "Home supplies"], amount: [450, 2800], perMonth: 3 },
  { category: "Entertainment", notes: ["Movie night", "Streaming subscription", "Arcade", "Concert ticket share"], amount: [250, 1500], perMonth: 4 },
  { category: "Health", notes: ["Pharmacy", "Clinic checkup", "Vitamins"], amount: [300, 1800], perMonth: 2 },
];

function seedState(): FinanceState {
  const rand = prng(20261018);
  const now = new Date();
  const txs: Transaction[] = [];

  for (let back = 5; back >= 0; back--) {
    const y = now.getFullYear();
    const m = now.getMonth() - back;
    const monthDate = new Date(y, m, 1);
    const key = monthKey(monthDate);
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const isCurrent = back === 0;
    const maxDay = isCurrent ? now.getDate() : daysInMonth;

    const push = (
      day: number,
      amount: number,
      type: "income" | "expense",
      category: string,
      note: string
    ) => {
      if (day > maxDay || day < 1) return;
      txs.push({
        id: uid("seed"),
        date: `${key}-${String(day).padStart(2, "0")}`,
        amount: Math.round(amount),
        type,
        category,
        note,
      });
    };

    for (const b of MONTHLY_BILLS) {
      const amt = b.amount[0] + rand() * (b.amount[1] - b.amount[0]);
      push(b.day, amt, b.txType, b.category, b.note);
    }
    for (const r of RECURRING) {
      if (rand() < (r.chance ?? 1)) {
        const amt = r.amount[0] + rand() * (r.amount[1] - r.amount[0]);
        push(r.day, amt, r.txType, r.category, r.note);
      }
    }
    for (const s of SMALL_EXPENSES) {
      for (let i = 0; i < s.perMonth; i++) {
        const day = 1 + Math.floor(rand() * maxDay);
        const amt = s.amount[0] + rand() * (s.amount[1] - s.amount[0]);
        const note = s.notes[Math.floor(rand() * s.notes.length)];
        push(day, amt, "expense", s.category, note);
      }
    }
  }

  txs.sort((a, b) => b.date.localeCompare(a.date));

  return {
    transactions: txs,
    budgets: [
      { category: "Food & Dining", limit: 6000 },
      { category: "Groceries", limit: 12000 },
      { category: "Transport", limit: 4000 },
      { category: "Shopping", limit: 5000 },
      { category: "Entertainment", limit: 3000 },
      { category: "Utilities", limit: 5000 },
    ],
  };
}

function loadState(): FinanceState {
  if (typeof window === "undefined") return { transactions: [], budgets: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FinanceState;
      if (Array.isArray(parsed.transactions) && Array.isArray(parsed.budgets)) {
        return parsed;
      }
    }
  } catch {
    /* corrupted storage — fall through to seed */
  }
  const seeded = seedState();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  } catch {
    /* storage unavailable — keep in memory */
  }
  return seeded;
}

/* ------------------------------------------------------------------ */
/* Context                                                             */
/* ------------------------------------------------------------------ */

interface FinanceContextValue {
  state: FinanceState;
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
  exportReady: boolean;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, mounted]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      state,
      dispatch,
      resetDemo: () => dispatch({ type: "RESET" }),
      exportReady: state.transactions.length > 0,
    }),
    [state]
  );

  if (!mounted) {
    return (
      <div className="min-h-screen app-bg flex items-center justify-center">
        <p className="text-brand-deep font-medium">Loading SpendWise…</p>
      </div>
    );
  }

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside FinanceProvider");
  return ctx;
}

export function newId(): string {
  return uid("tx");
}

/** Transactions for a given month key */
export function txsForMonth(
  txs: Transaction[],
  key: string
): Transaction[] {
  return txs.filter((t) => t.date.startsWith(key));
}

/** Sum of amounts for a type within a list */
export function sumByType(txs: Transaction[], type: "income" | "expense"): number {
  return txs.reduce((s, t) => s + (t.type === type ? t.amount : 0), 0);
}

/** Today's date as YYYY-MM-DD (local) */
export function todayISO(): string {
  return toISODate(new Date());
}
