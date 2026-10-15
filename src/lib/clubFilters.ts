import type { ClubSummary, ZoneType } from "@/types/club";

export type SortOption = "rating" | "price-asc" | "price-desc" | "seats";

export interface ClubFilters {
  query: string;
  zoneTypes: ZoneType[];
  maxPrice: number | null;
  minHz: number | null;
  onlyFree: boolean;
  only24h: boolean;
  sort: SortOption;
}

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "rating", label: "По рейтингу" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "seats", label: "Больше свободных мест" },
];

export const priceOptions = [500, 800, 1000, 1500];

export const hzOptions = [144, 165, 240, 360];

export const zoneTypeValues: ZoneType[] = [
  "standard",
  "vip",
  "bootcamp",
  "console",
];

const sortValues = sortOptions.map((option) => option.value);

function parsePositiveNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

export function parseFilters(params: URLSearchParams): ClubFilters {
  const sort = params.get("sort") as SortOption | null;

  return {
    query: params.get("q") ?? "",
    zoneTypes: (params.get("zones") ?? "")
      .split(",")
      .filter((value): value is ZoneType =>
        zoneTypeValues.includes(value as ZoneType),
      ),
    maxPrice: parsePositiveNumber(params.get("maxPrice")),
    minHz: parsePositiveNumber(params.get("minHz")),
    onlyFree: params.get("free") === "1",
    only24h: params.get("24h") === "1",
    sort: sort && sortValues.includes(sort) ? sort : "rating",
  };
}

export function filtersToParams(filters: ClubFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.zoneTypes.length > 0)
    params.set("zones", filters.zoneTypes.join(","));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.minHz) params.set("minHz", String(filters.minHz));
  if (filters.onlyFree) params.set("free", "1");
  if (filters.only24h) params.set("24h", "1");
  if (filters.sort !== "rating") params.set("sort", filters.sort);

  return params;
}

export function countActiveFilters(filters: ClubFilters): number {
  return [
    filters.query.trim() !== "",
    filters.zoneTypes.length > 0,
    filters.maxPrice !== null,
    filters.minHz !== null,
    filters.onlyFree,
    filters.only24h,
  ].filter(Boolean).length;
}

export function applyFilters(
  clubs: ClubSummary[],
  filters: ClubFilters,
): ClubSummary[] {
  const query = filters.query.trim().toLowerCase();

  const filtered = clubs.filter((club) => {
    if (query && !`${club.name} ${club.address}`.toLowerCase().includes(query))
      return false;
    if (
      filters.zoneTypes.length > 0 &&
      !filters.zoneTypes.some((type) => club.zoneTypes.includes(type))
    )
      return false;
    if (filters.maxPrice && club.minPricePerHour > filters.maxPrice)
      return false;
    if (filters.minHz && club.maxRefreshRateHz < filters.minHz) return false;
    if (filters.onlyFree && club.seatsFree === 0) return false;
    if (filters.only24h && !club.is24h) return false;
    return true;
  });

  return filtered.sort((a, b) => {
    switch (filters.sort) {
      case "price-asc":
        return a.minPricePerHour - b.minPricePerHour;
      case "price-desc":
        return b.minPricePerHour - a.minPricePerHour;
      case "seats":
        return b.seatsFree - a.seatsFree;
      default:
        return b.rating - a.rating;
    }
  });
}
