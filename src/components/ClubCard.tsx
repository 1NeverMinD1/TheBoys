import { Link } from "react-router";
import type { ClubSummary } from "@/types/club";
import { formatPrice } from "@/lib/club";
import { pluralize } from "@/lib/format";
import { zoneTypeLabels, zoneTypeStyles } from "@/lib/labels";
import { ClubCover } from "@/components/ClubCover";
import { SeatsIndicator } from "@/components/SeatsIndicator";

interface ClubCardProps {
  club: ClubSummary;
}

export function ClubCard({ club }: ClubCardProps) {
  return (
    <Link
      to={`/clubs/${club.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 transition hover:-translate-y-0.5 hover:border-violet-500/60"
    >
      <div className="relative aspect-video overflow-hidden">
        <ClubCover
          name={club.name}
          photo={club.photo}
          className="transition duration-300 group-hover:scale-105"
        />
        {club.is24h && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            24/7
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
          ★ {club.rating.toFixed(1)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold group-hover:text-violet-300">
            {club.name}
          </h2>
          <p className="text-sm text-neutral-400">
            {club.address} · {club.reviewsCount}{" "}
            {pluralize(club.reviewsCount, ["отзыв", "отзыва", "отзывов"])}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {club.zoneTypes.map((type) => (
            <span
              key={type}
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${zoneTypeStyles[type]}`}
            >
              {zoneTypeLabels[type]}
            </span>
          ))}
        </div>

        {club.topGpu && (
          <p className="text-sm text-neutral-300">
            <span className="text-neutral-500">Топ ПК: </span>
            {club.topGpu}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between border-t border-neutral-800 pt-3">
          <SeatsIndicator free={club.seatsFree} total={club.seatsTotal} />
          <p className="text-right">
            <span className="text-xs text-neutral-500">от </span>
            <span className="text-lg font-bold">
              {formatPrice(club.minPricePerHour)}
            </span>
            <span className="text-xs text-neutral-500"> / час</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
