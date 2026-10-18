import type { ReactNode } from "react";

interface Props {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

/** Bento grid tile: white card, soft border, title row, content slot. */
export default function BentoCard({
  title,
  subtitle,
  children,
  className = "",
  action,
}: Props) {
  return (
    <section
      className={`bg-paper rounded-2xl border border-brand-soft card-shadow p-5 flex flex-col ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-brand-ink tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">{children}</div>
    </section>
  );
}
