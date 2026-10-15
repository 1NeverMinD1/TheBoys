import type { Tariff } from "@/types/club";

export function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateValue(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getNextDays(
  count: number,
): { value: string; label: string; sub: string }[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index,
    );
    const label =
      index === 0
        ? "Сегодня"
        : index === 1
          ? "Завтра"
          : date.toLocaleDateString("ru-RU", { weekday: "short" });
    return {
      value: toDateValue(date),
      label,
      sub: date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
    };
  });
}

export function getTimeSlots(dateValue: string): string[] {
  const now = new Date();
  const isToday = dateValue === toDateValue(now);
  return Array.from({ length: 24 }, (_, hour) => hour)
    .filter((hour) => !isToday || hour > now.getHours())
    .map((hour) => `${String(hour).padStart(2, "0")}:00`);
}

export function addHours(time: string, hours: number): string {
  const [hour, minute] = time.split(":").map(Number);
  return `${String((hour + hours) % 24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getTariffHours(tariff: Tariff, hourlyCount: number): number {
  return tariff.kind === "hourly" ? hourlyCount : (tariff.hours ?? 1);
}

export function calcTotal(
  tariff: Tariff,
  hourlyCount: number,
  seatsCount: number,
): number {
  const base =
    tariff.kind === "hourly" ? tariff.price * hourlyCount : tariff.price;
  return base * Math.max(seatsCount, 1);
}

export function isValidPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length === 11;
}

export function formatDateLong(value: string): string {
  return fromDateValue(value).toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
