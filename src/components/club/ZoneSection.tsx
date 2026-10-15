import type { Zone } from "@/types/club";
import { zoneTypeLabels, zoneTypeStyles } from "@/lib/labels";
import { SeatsIndicator } from "@/components/SeatsIndicator";
import { SpecGrid } from "@/components/club/SpecGrid";
import { TariffList } from "@/components/club/TariffList";

interface ZoneSectionProps {
  zones: Zone[];
  selectedZone: Zone;
  onSelect: (zoneId: string) => void;
}

export function ZoneSection({
  zones,
  selectedZone,
  onSelect,
}: ZoneSectionProps) {
  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <h2 className="mb-4 text-xl font-bold">Зоны и тарифы</h2>

      <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {zones.map((zone) => {
          const active = zone.id === selectedZone.id;
          return (
            <button
              key={zone.id}
              type="button"
              onClick={() => onSelect(zone.id)}
              className={`shrink-0 rounded-xl border px-4 py-2.5 text-left transition ${
                active
                  ? "border-violet-500 bg-violet-600/15"
                  : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
              }`}
            >
              <span className="block text-sm font-semibold">{zone.name}</span>
              <span className="block text-xs text-neutral-500">
                {zone.seatsFree > 0 ? `${zone.seatsFree} свободно` : "занято"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">{selectedZone.name}</h3>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${zoneTypeStyles[selectedZone.type]}`}
          >
            {zoneTypeLabels[selectedZone.type]}
          </span>
        </div>
        <SeatsIndicator
          free={selectedZone.seatsFree}
          total={selectedZone.seatsTotal}
        />
      </div>

      <div className="space-y-6">
        {selectedZone.pcSpec && <SpecGrid spec={selectedZone.pcSpec} />}

        {selectedZone.peripherals.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {selectedZone.pcSpec ? "Периферия" : "Оборудование"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {selectedZone.peripherals.map((item) => (
                <span
                  key={item}
                  className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-neutral-300"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Тарифы
          </h4>
          <TariffList tariffs={selectedZone.tariffs} />
        </div>
      </div>
    </section>
  );
}
