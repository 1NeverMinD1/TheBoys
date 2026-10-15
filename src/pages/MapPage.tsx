import { useMemo, useState } from "react";
import { useClubs } from "@/hooks/useClubs";
import { useClubFilters } from "@/hooks/useClubFilters";
import { applyFilters } from "@/lib/clubFilters";
import { getDistanceKm } from "@/lib/map";
import { pluralize } from "@/lib/format";
import type { ClubSummary, Coords } from "@/types/club";
import { ClubsMap } from "@/components/map/ClubsMap";
import { MapClubItem } from "@/components/map/MapClubItem";
import { MapClubPreview } from "@/components/map/MapClubPreview";

type GeoStatus = "idle" | "loading" | "error";

const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

export function MapPage() {
  const { data: clubs, isLoading, isError, refetch } = useClubs();
  const { filters, updateFilters } = useClubFilters();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<Coords | null>(null);
  const [userPosition, setUserPosition] = useState<Coords | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>("idle");

  const visibleClubs = useMemo(() => {
    if (!clubs) {
      return [];
    }
    const filtered = applyFilters(clubs, filters);
    if (!userPosition) {
      return filtered;
    }
    return [...filtered].sort(
      (a, b) =>
        getDistanceKm(userPosition, a.coords) -
        getDistanceKm(userPosition, b.coords),
    );
  }, [clubs, filters, userPosition]);

  const selectedClub =
    visibleClubs.find((club) => club.id === selectedId) ?? null;
  const getDistance = (club: ClubSummary) =>
    userPosition ? getDistanceKm(userPosition, club.coords) : null;

  const handleMarkerSelect = (clubId: string) => {
    setSelectedId(clubId);
    if (isDesktop()) {
      document
        .getElementById(`map-club-${clubId}`)
        ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  const handleListSelect = (club: ClubSummary) => {
    setSelectedId(club.id);
    setFlyTarget({ ...club.coords });
    if (!isDesktop()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserPosition(coords);
        setFlyTarget(coords);
        setGeoStatus("idle");
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const chipClass = (active: boolean) =>
    `rounded-lg border px-3 py-1.5 text-sm transition ${
      active
        ? "border-violet-500 bg-violet-600/20 text-violet-200"
        : "border-neutral-700 text-neutral-300 hover:border-neutral-500"
    }`;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-9rem)] lg:flex-row">
      <div className="relative h-[55vh] min-h-[360px] overflow-hidden rounded-2xl border border-neutral-800 lg:order-2 lg:h-auto lg:flex-1">
        <ClubsMap
          clubs={visibleClubs}
          selectedId={selectedId}
          flyTarget={flyTarget}
          userPosition={userPosition}
          onSelect={handleMarkerSelect}
          onMapClick={() => setSelectedId(null)}
        />

        <button
          type="button"
          onClick={handleLocate}
          disabled={geoStatus === "loading"}
          className="absolute right-3 top-3 z-[1000] rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-sm font-medium backdrop-blur transition hover:border-violet-500 disabled:opacity-60"
        >
          {geoStatus === "loading" ? "Определяем..." : "Рядом со мной"}
        </button>

        {selectedClub && (
          <div className="absolute inset-x-3 bottom-8 z-[1000] lg:left-auto lg:w-96">
            <MapClubPreview
              club={selectedClub}
              distanceKm={getDistance(selectedClub)}
              onClose={() => setSelectedId(null)}
            />
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-3 lg:order-1 lg:min-h-0 lg:w-[380px]">
        <div className="flex items-end justify-between gap-2">
          <h1 className="text-xl font-bold">Карта клубов</h1>
          {clubs && (
            <span className="text-sm text-neutral-400">
              {visibleClubs.length}{" "}
              {pluralize(visibleClubs.length, ["клуб", "клуба", "клубов"])}
            </span>
          )}
        </div>

        <input
          type="search"
          value={filters.query}
          onChange={(event) => updateFilters({ query: event.target.value })}
          placeholder="Название или адрес"
          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:border-violet-500"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateFilters({ onlyFree: !filters.onlyFree })}
            className={chipClass(filters.onlyFree)}
          >
            Есть места
          </button>
          <button
            type="button"
            onClick={() => updateFilters({ only24h: !filters.only24h })}
            className={chipClass(filters.only24h)}
          >
            24/7
          </button>
        </div>

        {geoStatus === "error" && (
          <p className="text-xs text-amber-300">
            Не удалось определить местоположение. Разреши доступ к геолокации в
            настройках браузера.
          </p>
        )}

        <div className="space-y-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {isLoading &&
            Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-xl bg-neutral-900"
              />
            ))}

          {isError && (
            <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-center text-sm">
              <p className="mb-2 text-red-300">Не удалось загрузить клубы</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="text-violet-400 hover:underline"
              >
                Повторить
              </button>
            </div>
          )}

          {clubs && visibleClubs.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-800 p-6 text-center text-sm text-neutral-400">
              Ничего не нашлось
            </p>
          )}

          {visibleClubs.map((club) => (
            <MapClubItem
              key={club.id}
              club={club}
              active={club.id === selectedId}
              distanceKm={getDistance(club)}
              onClick={() => handleListSelect(club)}
            />
          ))}
        </div>
      </aside>
    </div>
  );
}
