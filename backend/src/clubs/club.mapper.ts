/**
 * Мапперы: превращают сущности базы в JSON строго по типам фронта
 * (src/types/club.ts). Если фронт поменяет типы — правим только здесь.
 */
import { Club } from './entities/club.entity';
import { Tariff } from './entities/tariff.entity';
import { Zone, ZoneType } from './entities/zone.entity';

export type ZoneStats = Map<string, { total: number; busy: number }>;

export function toTariffDto(t: Tariff) {
  return {
    id: t.id,
    name: t.name,
    kind: t.kind,
    hours: t.hours,
    price: t.price,
    timeFrom: t.timeFrom,
    timeTo: t.timeTo,
  };
}

export function toZoneDto(zone: Zone, stats: ZoneStats) {
  const s = stats.get(zone.id) ?? { total: 0, busy: 0 };
  return {
    id: zone.id,
    name: zone.name,
    type: zone.type,
    seatsTotal: s.total,
    seatsFree: Math.max(0, s.total - s.busy),
    pcSpec: zone.pcSpec,
    peripherals: zone.peripherals,
    tariffs: (zone.tariffs ?? []).map(toTariffDto),
  };
}

export type ZoneDto = ReturnType<typeof toZoneDto>;

export function toClubDto(club: Club, stats: ZoneStats) {
  return {
    id: club.id,
    name: club.name,
    city: club.city,
    address: club.address,
    coords: { lat: club.lat, lng: club.lng },
    phone: club.phone,
    workingHours: { open: club.openTime, close: club.closeTime, is24h: club.is24h },
    photos: club.photos,
    rating: club.rating,
    reviewsCount: club.reviewsCount,
    description: club.description,
    equipment: club.equipment,
    zones: (club.zones ?? []).map((z) => toZoneDto(z, stats)),
  };
}

export type ClubDto = ReturnType<typeof toClubDto>;

// --- ClubSummary: логика 1-в-1 как в src/lib/club.ts на фронте ---------------

const hourlyPrices = (zone: ClubDto['zones'][number]) =>
  zone.tariffs.filter((t) => t.kind === 'hourly').map((t) => t.price);

export function toClubSummary(club: ClubDto) {
  const prices = club.zones.flatMap(hourlyPrices);

  // Топовая видеокарта — из зоны с ПК, где самый дорогой час
  const topZone = club.zones
    .filter((z) => z.pcSpec !== null)
    .sort((a, b) => Math.max(0, ...hourlyPrices(b)) - Math.max(0, ...hourlyPrices(a)))[0];

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
    minPricePerHour: prices.length > 0 ? Math.min(...prices) : 0,
    seatsFree: club.zones.reduce((sum, z) => sum + z.seatsFree, 0),
    seatsTotal: club.zones.reduce((sum, z) => sum + z.seatsTotal, 0),
    zoneTypes: Array.from(new Set(club.zones.map((z) => z.type))) as ZoneType[],
    topGpu: topZone?.pcSpec?.gpu ?? null,
    maxRefreshRateHz: Math.max(0, ...club.zones.map((z) => z.pcSpec?.refreshRateHz ?? 0)),
  };
}

export type ClubSummaryDto = ReturnType<typeof toClubSummary>;
