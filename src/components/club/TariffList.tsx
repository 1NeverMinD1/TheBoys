import type { Tariff } from "@/types/club";
import { formatPrice } from "@/lib/club";
import { tariffKindLabels } from "@/lib/labels";

interface TariffListProps {
  tariffs: Tariff[];
}

function getTariffNote(tariff: Tariff): string | null {
  if (tariff.kind === "night" && tariff.timeFrom && tariff.timeTo) {
    return `с ${tariff.timeFrom} до ${tariff.timeTo}`;
  }
  if (tariff.kind === "package" && tariff.hours) {
    return `≈ ${formatPrice(Math.round(tariff.price / tariff.hours))} за час`;
  }
  return null;
}

export function TariffList({ tariffs }: TariffListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {tariffs.map((tariff) => {
        const note = getTariffNote(tariff);
        return (
          <div
            key={tariff.id}
            className="flex flex-col rounded-xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-violet-500/60"
          >
            <span className="text-xs uppercase tracking-wide text-violet-300">
              {tariffKindLabels[tariff.kind]}
            </span>
            <span className="mt-1 text-neutral-300">{tariff.name}</span>
            <span className="mt-3 text-2xl font-bold">
              {formatPrice(tariff.price)}
            </span>
            {note && (
              <span className="mt-1 text-xs text-neutral-500">{note}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
