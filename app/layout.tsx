import type { Metadata } from "next";
import "./globals.css";
import { FinanceProvider } from "@/lib/store";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "SpendWise — Personal Finance Dashboard",
  description:
    "Track income and expenses, set monthly budgets, and see where your money goes. Created by devuvo.",
};

function Footer() {
  return (
    <footer className="border-t border-brand-soft mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        <span>SpendWise · your money, beautifully tracked</span>
        <span>Created by devuvo</span>
      </div>
    </footer>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col app-bg">
        <FinanceProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          <Footer />
        </FinanceProvider>
      </body>
    </html>
  );
}
