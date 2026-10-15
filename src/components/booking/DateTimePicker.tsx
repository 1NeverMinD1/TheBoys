interface DateTimePickerProps {
  days: { value: string; label: string; sub: string }[];
  date: string;
  slots: string[];
  startTime: string | null;
  fixedTime: string | null;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
}

export function DateTimePicker({
  days,
  date,
  slots,
  startTime,
  fixedTime,
  onDateChange,
  onTimeChange,
}: DateTimePickerProps) {
  return (
    <div className="space-y-5">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {days.map((day) => {
          const active = day.value === date;
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onDateChange(day.value)}
              className={`w-20 shrink-0 rounded-xl border py-2.5 text-center transition ${
                active
                  ? "border-violet-500 bg-violet-600/15"
                  : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
              }`}
            >
              <span className="block text-sm font-semibold capitalize">
                {day.label}
              </span>
              <span className="block text-xs text-neutral-500">{day.sub}</span>
            </button>
          );
        })}
      </div>

      {fixedTime ? (
        <p className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
          Ночной тариф начинается в{" "}
          <span className="font-semibold text-white">{fixedTime}</span>
        </p>
      ) : slots.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-800 p-4 text-center text-sm text-neutral-400">
          На этот день свободного времени уже нет, выбери другой
        </p>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((slot) => {
            const active = slot === startTime;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => onTimeChange(slot)}
                className={`rounded-lg border py-2 text-sm font-medium transition ${
                  active
                    ? "border-violet-400 bg-violet-600 text-white"
                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-600"
                }`}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
