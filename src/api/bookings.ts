import { mockClubs } from "@/mocks/clubs";
import { toDateValue } from "@/lib/booking";
import type { Booking, BookingRequest, Seat } from "@/types/booking";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function hash(value: string): number {
  let result = 0;
  for (const char of value) {
    result = (result * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(result);
}

export async function getZoneSeats(
  clubId: string,
  zoneId: string,
  date: string,
  startTime: string,
): Promise<Seat[]> {
  await delay(250);
  const zone = mockClubs
    .find((club) => club.id === clubId)
    ?.zones.find((item) => item.id === zoneId);
  if (!zone) {
    throw new Error("Зона не найдена");
  }

  const baseOccupied = zone.seatsTotal - zone.seatsFree;
  const occupiedCount =
    date === toDateValue(new Date())
      ? baseOccupied
      : Math.floor(baseOccupied / 2);
  const occupied = new Set<number>();
  let attempt = 0;

  while (occupied.size < occupiedCount) {
    occupied.add(
      hash(`${zoneId}-${date}-${startTime}-${attempt}`) % zone.seatsTotal,
    );
    attempt += 1;
  }

  return Array.from({ length: zone.seatsTotal }, (_, index) => ({
    id: `${zoneId}-seat-${index + 1}`,
    number: index + 1,
    isFree: !occupied.has(index),
  }));
}

export async function createBooking(request: BookingRequest): Promise<Booking> {
  await delay(800);
  return {
    ...request,
    id: `GC-${(hash(`${request.clubId}-${Date.now()}`) % 900000) + 100000}`,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
  };
}
