import type { Transaction } from "./types";

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function transactionsToCSV(txs: Transaction[]): string {
  const header = ["date", "type", "category", "amount_php", "note"];
  const rows = txs.map((t) =>
    [t.date, t.type, t.category, t.amount.toFixed(2), t.note]
      .map(csvCell)
      .join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCSV(txs: Transaction[]): void {
  const blob = new Blob([transactionsToCSV(txs)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `spendwise-transactions-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
