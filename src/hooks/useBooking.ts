import { useMutation, useQuery } from "@tanstack/react-query";
import { createBooking, getZoneSeats } from "@/api/bookings";

export function useZoneSeats(
  clubId: string | undefined,
  zoneId: string | undefined,
  date: string,
  startTime: string | null,
) {
  return useQuery({
    queryKey: ["seats", clubId, zoneId, date, startTime],
    queryFn: () =>
      getZoneSeats(
        clubId as string,
        zoneId as string,
        date,
        startTime as string,
      ),
    enabled: Boolean(clubId && zoneId && startTime),
    staleTime: 15_000,
  });
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: createBooking,
  });
}
