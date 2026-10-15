import type { Club } from "@/types/club";
import { formatWorkingHours } from "@/lib/club";
import { pluralize } from "@/lib/format";
import { ClubCover } from "@/components/ClubCover";

interface ClubHeroProps {
  club: Club;
}

export function ClubHero({ club }: ClubHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-neutral-800">
      <div className="h-60 sm:h-80">
        <ClubCover name={club.name} photo={club.photos[0] ?? null} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/70 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
            ★ {club.rating.toFixed(1)} · {club.reviewsCount}{" "}
            {pluralize(club.reviewsCount, ["отзыв", "отзыва", "отзывов"])}
          </span>
          <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {formatWorkingHours(club.workingHours)}
          </span>
        </div>
        <h1 className="text-3xl font-black sm:text-5xl">{club.name}</h1>
        <p className="mt-2 text-neutral-300">
          {club.city}, {club.address}
        </p>
      </div>
    </section>
  );
}
