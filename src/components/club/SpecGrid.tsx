import type { PcSpec } from "@/types/club";

interface SpecGridProps {
  spec: PcSpec;
}

export function SpecGrid({ spec }: SpecGridProps) {
  const items = [
    { label: "Процессор", value: spec.cpu },
    { label: "Видеокарта", value: spec.gpu },
    { label: "Оперативная память", value: `${spec.ramGb} ГБ` },
    { label: "Монитор", value: `${spec.monitor} · ${spec.refreshRateHz} Гц` },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-neutral-800 bg-neutral-950 p-4"
        >
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {item.label}
          </p>
          <p className="mt-1 font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
