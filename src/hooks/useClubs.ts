import { useQuery } from "@tanstack/react-query";
import { getClubById, getClubs } from "@/api/clubs";

export const clubKeys = {
  all: ["clubs"] as const,
  list: () => [...clubKeys.all, "list"] as const,
  detail: (id: string) => [...clubKeys.all, "detail", id] as const,
};

export function useClubs() {
  return useQuery({
    queryKey: clubKeys.list(),
    queryFn: getClubs,
  });
}

export function useClub(id: string | undefined) {
  return useQuery({
    queryKey: clubKeys.detail(id ?? ""),
    queryFn: () => getClubById(id as string),
    enabled: Boolean(id),
  });
}
