import type { ReactNode } from "react";
import type { ClubFilters } from "@/lib/clubFilters";
import { hzOptions, priceOptions, zoneTypeValues } from "@/lib/clubFilters";
import { zoneTypeLabels } from "@/lib/labels";
import { formatPrice } from "@/lib/club";
import type { ZoneType } from "@/types/club";

interface CatalogFiltersProps {
  filters: ClubFilters;
  activeCount: number;
  onChange: (patch: Partial<ClubFilters>) => void;
  onReset: () => void;
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-sm transition ${
        active
          ? "border-violet-500 bg-violet-600/20 text-violet-200"
          : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
      }`}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Toggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm text-neutral-300">
      {label}
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-violet-500"
      />
    </label>
  );
}

export function CatalogFilters({
  filters,
  activeCount,
  onChange,
  onReset,
}: CatalogFiltersProps) {
  const toggleZoneType = (type: ZoneType) => {
    const zoneTypes = filters.zoneTypes.includes(type)
      ? filters.zoneTypes.filter((item) => item !== type)
      : [...filters.zoneTypes, type];
    onChange({ zoneTypes });
  };

  return (
    <div className="space-y-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <input
        type="search"
        value={filters.query}
        onChange={(event) => onChange({ query: event.target.value })}
        placeholder="Название или адрес"
        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-violet-500"
      />

      <Section title="Тип зоны">
        <div className="flex flex-wrap gap-2">
          {zoneTypeValues.map((type) => (
            <Chip
              key={type}
              active={filters.zoneTypes.includes(type)}
              onClick={() => toggleZoneType(type)}
            >
              {zoneTypeLabels[type]}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Цена за час до">
        <div className="flex flex-wrap gap-2">
          <Chip
            active={filters.maxPrice === null}
            onClick={() => onChange({ maxPrice: null })}
          >
            Любая
          </Chip>
          {priceOptions.map((price) => (
            <Chip
              key={price}
              active={filters.maxPrice === price}
              onClick={() => onChange({ maxPrice: price })}
            >
              {formatPrice(price)}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Монитор от">
        <div className="flex flex-wrap gap-2">
          <Chip
            active={filters.minHz === null}
            onClick={() => onChange({ minHz: null })}
          >
            Любой
          </Chip>
          {hzOptions.map((hz) => (
            <Chip
              key={hz}
              active={filters.minHz === hz}
              onClick={() => onChange({ minHz: hz })}
            >
              {hz} Гц
            </Chip>
          ))}
        </div>
      </Section>

      <div className="space-y-3">
        <Toggle
          checked={filters.onlyFree}
          label="Есть свободные места"
          onChange={(value) => onChange({ onlyFree: value })}
        />
        <Toggle
          checked={filters.only24h}
          label="Круглосуточно"
          onChange={(value) => onChange({ only24h: value })}
        />
      </div>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-lg border border-neutral-700 py-2 text-sm text-neutral-300 transition hover:border-red-500 hover:text-red-300"
        >
          Сбросить фильтры ({activeCount})
        </button>
      )}
    </div>
  );
}
