import { formatPrice } from "@/lib/club";

interface BookingSummaryProps {
  clubName: string;
  zoneName: string;
  tariffName: string;
  dateLabel: string;
  timeLabel: string | null;
  hoursLabel: string;
  seatsLabel: string;
  total: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  isError: boolean;
  onSubmit: () => void;
}

export function BookingSummary({
  clubName,
  zoneName,
  tariffName,
  dateLabel,
  timeLabel,
  hoursLabel,
  seatsLabel,
  total,
  canSubmit,
  isSubmitting,
  isError,
  onSubmit,
}: BookingSummaryProps) {
  const rows = [
    { label: "Клуб", value: clubName },
    { label: "Зона", value: zoneName },
    { label: "Тариф", value: tariffName },
    { label: "Дата", value: dateLabel },
    { label: "Время", value: timeLabel ?? "не выбрано" },
    { label: "Длительность", value: hoursLabel },
    { label: "Места", value: seatsLabel },
  ];

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-bold">Ваша бронь</h2>

      <dl className="space-y-2.5 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="text-right text-neutral-200 first-letter:uppercase">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex items-end justify-between border-t border-neutral-800 pt-4">
        <span className="text-neutral-400">Итого</span>
        <span className="text-3xl font-black">{formatPrice(total)}</span>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-5 w-full rounded-xl bg-violet-600 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-neutral-800 disabled:text-neutral-500"
      >
        {isSubmitting ? "Создаём бронь..." : "Забронировать"}
      </button>

      {isError && (
        <p className="mt-3 text-center text-sm text-red-400">
          Не удалось создать бронь, попробуй ещё раз
        </p>
      )}

      <p className="mt-3 text-center text-xs text-neutral-500">
        Оплата будет доступна после подтверждения брони
      </p>
    </div>
  );
}
