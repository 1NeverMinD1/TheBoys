import type { Tariff } from "@/types/club";
import { formatPrice } from "@/lib/club";
import { pluralize } from "@/lib/format";
import { tariffKindLabels } from "@/lib/labels";

interface TariffPickerProps {
  tariffs: Tariff[];
  selectedId: string;
  hourlyCount: number;
  onSelect: (tariffId: string) => void;
  onHourlyCountChange: (count: number) => void;
}

export function TariffPicker({
  tariffs,
  selectedId,
  hourlyCount,
  onSelect,
  onHourlyCountChange,
}: TariffPickerProps) {
  const selected = tariffs.find((tariff) => tariff.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {tariffs.map((tariff) => {
          const active = tariff.id === selectedId;
          return (
            <button
              key={tariff.id}
              type="button"
              onClick={() => onSelect(tariff.id)}
              className={`rounded-xl border p-4 text-left transition ${
                active
                  ? "border-violet-500 bg-violet-600/15"
                  : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
              }`}
            >
              <span className="block text-xs uppercase tracking-wide text-violet-300">
                {tariffKindLabels[tariff.kind]}
              </span>
              <span className="mt-1 block text-sm text-neutral-300">
                {tariff.name}
              </span>
              <span className="mt-2 block text-xl font-bold">
                {formatPrice(tariff.price)}
              </span>
            </button>
          );
        })}
      </div>

      {selected?.kind === "hourly" && (
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <span className="text-sm text-neutral-300">Сколько часов</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onHourlyCountChange(Math.max(1, hourlyCount - 1))}
              disabled={hourlyCount <= 1}
              className="h-9 w-9 rounded-lg border border-neutral-700 text-lg transition hover:border-violet-500 disabled:opacity-40"
            >
              −
            </button>
            <span className="w-20 text-center font-semibold">
              {hourlyCount} {pluralize(hourlyCount, ["час", "часа", "часов"])}
            </span>
            <button
              type="button"
              onClick={() => onHourlyCountChange(Math.min(12, hourlyCount + 1))}
              disabled={hourlyCount >= 12}
              className="h-9 w-9 rounded-lg border border-neutral-700 text-lg transition hover:border-violet-500 disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
