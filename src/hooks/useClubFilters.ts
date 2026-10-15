import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router";
import {
  countActiveFilters,
  filtersToParams,
  parseFilters,
  type ClubFilters,
} from "@/lib/clubFilters";

export function useClubFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);

  const updateFilters = useCallback(
    (patch: Partial<ClubFilters>) => {
      setSearchParams(filtersToParams({ ...filters, ...patch }), {
        replace: true,
      });
    },
    [filters, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    setSearchParams(
      filtersToParams({
        ...parseFilters(new URLSearchParams()),
        sort: filters.sort,
      }),
      {
        replace: true,
      },
    );
  }, [filters.sort, setSearchParams]);

  return {
    filters,
    updateFilters,
    resetFilters,
    activeCount: countActiveFilters(filters),
  };
}
