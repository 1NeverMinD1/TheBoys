import { Link } from "react-router";
import type { Club, Zone } from "@/types/club";
import {
  formatPrice,
  formatWorkingHours,
  getZoneHourlyPrice,
} from "@/lib/club";
import { SeatsIndicator } from "@/components/SeatsIndicator";

interface BookingSidebarProps {
  club: Club;
  zone: Zone;
}

export function BookingSidebar({ club, zone }: BookingSidebarProps) {
  const hasSeats = zone.seatsFree > 0;

  const info = [
    { label: "Режим работы", value: formatWorkingHours(club.workingHours) },
    { label: "Адрес", value: club.address },
  ];

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <div>
        <p className="text-sm text-neutral-400">Зона: {zone.name}</p>
        <p className="mt-1">
          <span className="text-sm text-neutral-500">от </span>
          <span className="text-3xl font-black">
            {formatPrice(getZoneHourlyPrice(zone))}
          </span>
          <span className="text-sm text-neutral-500"> / час</span>
        </p>
      </div>

      <SeatsIndicator free={zone.seatsFree} total={zone.seatsTotal} />

      {hasSeats ? (
        <Link
          to={`/clubs/${club.id}/booking?zone=${zone.id}`}
          className="block rounded-xl bg-violet-600 py-3 text-center font-semibold transition hover:bg-violet-500"
        >
          Забронировать
        </Link>
      ) : (
        <span className="block cursor-not-allowed rounded-xl bg-neutral-800 py-3 text-center font-semibold text-neutral-500">
          В этой зоне мест нет
        </span>
      )}

      <dl className="space-y-3 border-t border-neutral-800 pt-4 text-sm">
        {info.map((item) => (
          <div key={item.label} className="flex justify-between gap-4">
            <dt className="text-neutral-500">{item.label}</dt>
            <dd className="text-right text-neutral-200">{item.value}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4">
          <dt className="text-neutral-500">Телефон</dt>
          <dd>
            <a
              href={`tel:${club.phone.replace(/\s/g, "")}`}
              className="text-violet-400 hover:text-violet-300"
            >
              {club.phone}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
