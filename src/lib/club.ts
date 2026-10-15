import type {
  Club,
  ClubSummary,
  WorkingHours,
  Zone,
  ZoneType,
} from "@/types/club";

export function getMinHourlyPrice(club: Club): number {
  const prices = club.zones.flatMap((zone) =>
    zone.tariffs
      .filter((tariff) => tariff.kind === "hourly")
      .map((tariff) => tariff.price),
  );
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function getZoneHourlyPrice(zone: Zone): number {
  const hourly = zone.tariffs
    .filter((tariff) => tariff.kind === "hourly")
    .map((tariff) => tariff.price);
  if (hourly.length > 0) {
    return Math.min(...hourly);
  }
  const perHour = zone.tariffs
    .filter((tariff) => tariff.hours)
    .map((tariff) => Math.round(tariff.price / (tariff.hours as number)));
  return perHour.length > 0 ? Math.min(...perHour) : 0;
}

function getMaxHourlyPrice(zone: Zone): number {
  const prices = zone.tariffs
    .filter((tariff) => tariff.kind === "hourly")
    .map((tariff) => tariff.price);
  return prices.length > 0 ? Math.max(...prices) : 0;
}

export function getTopGpu(club: Club): string | null {
  const zoneWithPc = [...club.zones]
    .filter((zone) => zone.pcSpec !== null)
    .sort((a, b) => getMaxHourlyPrice(b) - getMaxHourlyPrice(a))[0];
  return zoneWithPc?.pcSpec?.gpu ?? null;
}

export function getMaxRefreshRate(club: Club): number {
  return Math.max(
    0,
    ...club.zones.map((zone) => zone.pcSpec?.refreshRateHz ?? 0),
  );
}

export function getSeats(club: Club): { free: number; total: number } {
  return {
    free: club.zones.reduce((sum, zone) => sum + zone.seatsFree, 0),
    total: club.zones.reduce((sum, zone) => sum + zone.seatsTotal, 0),
  };
}

export function toClubSummary(club: Club): ClubSummary {
  const zoneTypes = Array.from(
    new Set(club.zones.map((zone) => zone.type)),
  ) as ZoneType[];
  const seats = getSeats(club);

  return {
    id: club.id,
    name: club.name,
    city: club.city,
    address: club.address,
    coords: club.coords,
    photo: club.photos[0] ?? null,
    rating: club.rating,
    reviewsCount: club.reviewsCount,
    is24h: club.workingHours.is24h,
    minPricePerHour: getMinHourlyPrice(club),
    seatsFree: seats.free,
    seatsTotal: seats.total,
    zoneTypes,
    topGpu: getTopGpu(club),
    maxRefreshRateHz: getMaxRefreshRate(club),
  };
}

export function formatPrice(value: number): string {
  return `${value.toLocaleString("ru-RU")} ₸`;
}

export function formatWorkingHours(hours: WorkingHours): string {
  return hours.is24h ? "Круглосуточно" : `${hours.open} – ${hours.close}`;
}
