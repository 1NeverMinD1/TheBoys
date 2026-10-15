import { Link } from "react-router";
import type { Booking } from "@/types/booking";
import { formatPrice } from "@/lib/club";
import { addHours, formatDateLong } from "@/lib/booking";

interface BookingSuccessProps {
  booking: Booking;
  clubName: string;
  zoneName: string;
  seatsLabel: string;
}

export function BookingSuccess({
  booking,
  clubName,
  zoneName,
  seatsLabel,
}: BookingSuccessProps) {
  const rows = [
    { label: "Клуб", value: clubName },
    { label: "Зона", value: zoneName },
    { label: "Места", value: seatsLabel },
    { label: "Дата", value: formatDateLong(booking.date) },
    {
      label: "Время",
      value: `${booking.startTime} – ${addHours(booking.startTime, booking.hours)}`,
    },
    { label: "Сумма", value: formatPrice(booking.total) },
  ];

  return (
    <div className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-400">
        ✓
      </div>
      <h1 className="mb-2 text-3xl font-black">Бронь создана</h1>
      <p className="mb-8 text-neutral-400">
        Номер брони{" "}
        <span className="font-semibold text-white">{booking.id}</span>, статус:
        ожидает оплаты
      </p>

      <dl className="mb-8 space-y-2.5 rounded-2xl border border-neutral-800 bg-neutral-900 p-5 text-left text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="text-right text-neutral-200 first-letter:uppercase">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to={`/clubs/${booking.clubId}`}
          className="rounded-xl border border-neutral-700 px-5 py-2.5 font-medium transition hover:border-violet-500"
        >
          Вернуться к клубу
        </Link>
        <Link
          to="/"
          className="rounded-xl bg-violet-600 px-5 py-2.5 font-medium transition hover:bg-violet-500"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
