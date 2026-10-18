const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
});

const pesoShort = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function fmtPeso(n: number): string {
  return peso.format(n);
}

/** Compact for chart axes: ₱45K */
export function fmtPesoCompact(n: number): string {
  return pesoShort.format(n);
}

const monthFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  year: "numeric",
});

const monthShortFmt = new Intl.DateTimeFormat("en-PH", { month: "short" });

const dayFmt = new Intl.DateTimeFormat("en-PH", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** "2026-10" for a Date */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "Oct 2026" */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthFmt.format(new Date(y, m - 1, 1));
}

/** "Oct" */
export function monthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return monthShortFmt.format(new Date(y, m - 1, 1));
}

/** "Oct 18, 2026" from YYYY-MM-DD */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return dayFmt.format(new Date(y, m - 1, d));
}

/** Last `n` month keys ending with the current month, oldest first */
export function lastNMonths(n: number, now = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

/** YYYY-MM-DD for a Date (local, no timezone shift) */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
