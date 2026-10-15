import { mockClubs } from "@/mocks/clubs";
import { toClubSummary } from "@/lib/club";
import type { Club, ClubSummary } from "@/types/club";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getClubs(): Promise<ClubSummary[]> {
  await delay(400);
  return mockClubs.map(toClubSummary);
}

export async function getClubById(id: string): Promise<Club> {
  await delay(300);
  const club = mockClubs.find((item) => item.id === id);
  if (!club) {
    throw new Error("Клуб не найден");
  }
  return club;
}
