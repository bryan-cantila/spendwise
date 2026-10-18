export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  /** ISO date string, YYYY-MM-DD */
  date: string;
  /** Amount in PHP, always positive; sign comes from `type` */
  amount: number;
  type: TxType;
  category: string;
  note: string;
}

export interface Budget {
  category: string;
  /** Monthly limit in PHP */
  limit: number;
}

export interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
}

export interface Category {
  name: string;
  color: string;
}

export const EXPENSE_CATEGORIES: Category[] = [
  { name: "Food & Dining", color: "#e8590c" },
  { name: "Groceries", color: "#2f9e44" },
  { name: "Transport", color: "#1971c2" },
  { name: "Housing", color: "#5f3dc4" },
  { name: "Utilities", color: "#0c8599" },
  { name: "Shopping", color: "#d6336c" },
  { name: "Health", color: "#e03131" },
  { name: "Entertainment", color: "#f08c00" },
  { name: "Education", color: "#3b5bdb" },
  { name: "Savings", color: "#1098ad" },
  { name: "Other", color: "#868e96" },
];

export const INCOME_CATEGORIES: Category[] = [
  { name: "Salary", color: "#2f9e44" },
  { name: "Freelance", color: "#0c8599" },
  { name: "Business", color: "#1971c2" },
  { name: "Other Income", color: "#66a80f" },
];

export function categoryColor(name: string): string {
  const found =
    EXPENSE_CATEGORIES.find((c) => c.name === name) ??
    INCOME_CATEGORIES.find((c) => c.name === name);
  return found ? found.color : "#868e96";
}
