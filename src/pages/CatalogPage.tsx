import { useMemo, useState } from "react";
import { useClubs } from "@/hooks/useClubs";
import { useClubFilters } from "@/hooks/useClubFilters";
import { applyFilters, sortOptions, type SortOption } from "@/lib/clubFilters";
import { pluralize } from "@/lib/format";
import { ClubCard } from "@/components/ClubCard";
import { ClubCardSkeleton } from "@/components/ClubCardSkeleton";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";

export function CatalogPage() {
  const { data: clubs, isLoading, isError, refetch } = useClubs();
  const { filters, updateFilters, resetFilters, activeCount } =
    useClubFilters();
  const [showFilters, setShowFilters] = useState(false);

  const visibleClubs = useMemo(
    () => (clubs ? applyFilters(clubs, filters) : []),
    [clubs, filters],
  );

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-2xl font-bold sm:text-3xl">Компьютерные клубы</h1>
        {clubs && (
          <p className="text-sm text-neutral-400">
            {pluralize(visibleClubs.length, ["Найден", "Найдено", "Найдено"])}{" "}
            {visibleClubs.length}{" "}
            {pluralize(visibleClubs.length, ["клуб", "клуба", "клубов"])}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-24">
            <CatalogFilters
              filters={filters}
              activeCount={activeCount}
              onChange={updateFilters}
              onReset={resetFilters}
            />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowFilters((value) => !value)}
              className="rounded-lg border border-neutral-700 px-4 py-2 text-sm font-medium lg:hidden"
            >
              {showFilters ? "Скрыть фильтры" : "Фильтры"}
              {activeCount > 0 && (
                <span className="ml-2 rounded-full bg-violet-600 px-2 py-0.5 text-xs">
                  {activeCount}
                </span>
              )}
            </button>
            <select
              value={filters.sort}
              onChange={(event) =>
                updateFilters({ sort: event.target.value as SortOption })
              }
              className="ml-auto rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-violet-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {isError && (
            <div className="rounded-2xl border border-red-900 bg-red-950/40 p-6 text-center">
              <p className="mb-3 text-red-300">Не удалось загрузить клубы</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500"
              >
                Повторить
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {isLoading &&
              Array.from({ length: 6 }, (_, index) => (
                <ClubCardSkeleton key={index} />
              ))}
            {visibleClubs.map((club) => (
              <ClubCard key={club.id} club={club} />
            ))}
          </div>

          {clubs && visibleClubs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-neutral-800 py-16 text-center">
              <p className="mb-4 text-neutral-400">
                По таким фильтрам ничего не нашлось
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
