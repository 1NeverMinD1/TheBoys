import type { TariffKind, ZoneType } from "@/types/club";

export const zoneTypeLabels: Record<ZoneType, string> = {
  standard: "Стандарт",
  vip: "VIP",
  bootcamp: "Буткемп",
  console: "Консоли",
};

export const zoneTypeStyles: Record<ZoneType, string> = {
  standard: "bg-neutral-800 text-neutral-300",
  vip: "bg-amber-500/15 text-amber-300",
  bootcamp: "bg-sky-500/15 text-sky-300",
  console: "bg-emerald-500/15 text-emerald-300",
};

export const tariffKindLabels: Record<TariffKind, string> = {
  hourly: "Почасовой",
  package: "Пакет",
  night: "Ночной",
};
