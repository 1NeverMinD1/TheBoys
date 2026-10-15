import type { ClubSummary } from "@/types/club";
import { formatPrice } from "@/lib/club";
import { formatDistance } from "@/lib/map";
import { SeatsIndicator } from "@/components/SeatsIndicator";

interface MapClubItemProps {
  club: ClubSummary;
  active: boolean;
  distanceKm: number | null;
  onClick: () => void;
}

export function MapClubItem({
  club,
  active,
  distanceKm,
  onClick,
}: MapClubItemProps) {
  return (
    <button
      id={`map-club-${club.id}`}
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition ${
        active
          ? "border-violet-500 bg-violet-600/10"
          : "border-neutral-800 bg-neutral-900 hover:border-neutral-600"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{club.name}</p>
          <p className="truncate text-sm text-neutral-400">{club.address}</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-amber-300">
          ★ {club.rating.toFixed(1)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <SeatsIndicator free={club.seatsFree} total={club.seatsTotal} />
        <span className="text-sm">
          {distanceKm !== null && (
            <span className="mr-2 text-neutral-500">
              {formatDistance(distanceKm)}
            </span>
          )}
          <span className="font-bold">
            от {formatPrice(club.minPricePerHour)}
          </span>
        </span>
      </div>
    </button>
  );
}
