import { useState } from "react";
import { Link, useParams } from "react-router";
import { useClub } from "@/hooks/useClubs";
import { ClubHero } from "@/components/club/ClubHero";
import { ZoneSection } from "@/components/club/ZoneSection";
import { AboutClub } from "@/components/club/AboutClub";
import { BookingSidebar } from "@/components/club/BookingSidebar";
import { ClubPageSkeleton } from "@/components/club/ClubPageSkeleton";

export function ClubPage() {
  const { clubId } = useParams();
  const { data: club, isLoading, isError } = useClub(clubId);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  if (isLoading) {
    return <ClubPageSkeleton />;
  }

  if (isError || !club) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">Клуб не найден</h1>
        <p className="mb-6 text-neutral-400">
          Возможно, он был удалён или ссылка неверная
        </p>
        <Link
          to="/clubs"
          className="rounded-lg bg-violet-600 px-5 py-2.5 font-medium hover:bg-violet-500"
        >
          К списку клубов
        </Link>
      </div>
    );
  }

  const selectedZone =
    club.zones.find((zone) => zone.id === selectedZoneId) ?? club.zones[0];

  return (
    <div className="space-y-6">
      <Link
        to="/clubs"
        className="inline-block text-sm text-neutral-400 hover:text-white"
      >
        ← Все клубы
      </Link>

      <ClubHero club={club} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {selectedZone && (
            <ZoneSection
              zones={club.zones}
              selectedZone={selectedZone}
              onSelect={setSelectedZoneId}
            />
          )}
          <AboutClub club={club} />
        </div>

        {selectedZone && (
          <aside className="order-first lg:order-none">
            <div className="lg:sticky lg:top-24">
              <BookingSidebar club={club} zone={selectedZone} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
