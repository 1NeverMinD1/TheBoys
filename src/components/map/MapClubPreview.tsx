import { Link } from "react-router";
import type { ClubSummary } from "@/types/club";
import { formatPrice } from "@/lib/club";
import { formatDistance } from "@/lib/map";
import { SeatsIndicator } from "@/components/SeatsIndicator";
import { ClubCover } from "@/components/ClubCover";

interface MapClubPreviewProps {
  club: ClubSummary;
  distanceKm: number | null;
  onClose: () => void;
}

export function MapClubPreview({
  club,
  distanceKm,
  onClose,
}: MapClubPreviewProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-700 bg-neutral-900/95 shadow-2xl shadow-black/60 backdrop-blur">
      <div className="flex gap-4 p-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
          <ClubCover name={club.name} photo={club.photo} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-lg font-bold">{club.name}</p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="-mr-1 -mt-1 h-7 w-7 shrink-0 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="truncate text-sm text-neutral-400">
            {club.address}
            {distanceKm !== null && ` · ${formatDistance(distanceKm)}`}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <SeatsIndicator free={club.seatsFree} total={club.seatsTotal} />
            <span className="text-sm text-amber-300">
              ★ {club.rating.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-neutral-800 px-4 py-3">
        <span>
          <span className="text-xs text-neutral-500">от </span>
          <span className="font-bold">{formatPrice(club.minPricePerHour)}</span>
          <span className="text-xs text-neutral-500"> / час</span>
        </span>
        <Link
          to={`/clubs/${club.id}`}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold transition hover:bg-violet-500"
        >
          Подробнее
        </Link>
      </div>
    </div>
  );
}
