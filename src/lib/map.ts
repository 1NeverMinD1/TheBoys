import L from "leaflet";
import type { Coords } from "@/types/club";
import { formatPrice } from "@/lib/club";

export const DEFAULT_CENTER: Coords = { lat: 51.1282, lng: 71.4304 };

export const DEFAULT_ZOOM = 12;

export const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

export function createPriceIcon(
  price: number,
  active: boolean,
  full: boolean,
): L.DivIcon {
  let stateClass = "border-violet-500 bg-neutral-900 text-white";
  if (active) {
    stateClass = "scale-110 border-violet-300 bg-violet-600 text-white";
  } else if (full) {
    stateClass = "border-neutral-600 bg-neutral-800 text-neutral-400";
  }

  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div class="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full border-2 px-2.5 py-1 text-xs font-bold shadow-lg shadow-black/50 transition ${stateClass}">${formatPrice(price)}</div>`,
  });
}

export function getDistanceKm(from: Coords, to: Coords): number {
  const earthRadius = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) *
      Math.cos(toRad(to.lat)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 1
    ? `${Math.round(km * 1000)} м`
    : `${km.toFixed(1).replace(".", ",")} км`;
}
