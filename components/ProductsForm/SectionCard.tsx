import { ReactNode } from "react";

// ─── SectionCard ─────────────────────────────────────────────────────────────
interface SectionCardProps {
  step?: number;
  title: string;
  children: ReactNode;
}

export const SectionCard = ({ step, title, children }: SectionCardProps) => (
  <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-linear-to-r from-primary/5 to-transparent rounded-t-xl">
      {step !== undefined && (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-xs font-bold shrink-0">
          {step}
        </span>
      )}
      <h2 className="text-xs font-bold text-primary uppercase tracking-widest">
        {title}
      </h2>
    </div>
    <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
  </section>
);

// ─── FieldLabel ───────────────────────────────────────────────────────────────
interface FieldLabelProps {
  htmlFor?: string;
  children: ReactNode;
}

export const FieldLabel = ({ htmlFor, children }: FieldLabelProps) => (
  <label
    htmlFor={htmlFor}
    className="text-xs font-semibold text-dark/60 uppercase tracking-wide"
  >
    {children}
  </label>
);
