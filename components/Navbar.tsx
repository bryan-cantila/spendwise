"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
];

/** Top navigation bar with logo + section links. */
export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur border-b border-brand-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="SpendWise logo"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <span className="text-lg font-bold text-brand-ink tracking-tight">
            SpendWise
          </span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {LINKS.map((l) => {
            const active =
              l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  active
                    ? "bg-brand text-white"
                    : "text-brand-deep hover:bg-brand-soft"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
