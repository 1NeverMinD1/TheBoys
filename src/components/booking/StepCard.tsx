import type { ReactNode } from "react";

interface StepCardProps {
  step: number;
  title: string;
  children: ReactNode;
}

export function StepCard({ step, title, children }: StepCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-sm font-bold text-violet-300">
          {step}
        </span>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
