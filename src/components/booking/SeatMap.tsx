import type { Seat } from "@/types/booking";

interface SeatMapProps {
  seats: Seat[];
  selectedIds: string[];
  isRoom: boolean;
  onToggle: (seatId: string) => void;
}

export function SeatMap({
  seats,
  selectedIds,
  isRoom,
  onToggle,
}: SeatMapProps) {
  return (
    <div>
      <div className="mb-4 rounded-lg bg-neutral-800 py-1.5 text-center text-xs uppercase tracking-widest text-neutral-500">
        Вход
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
        {seats.map((seat) => {
          const selected = selectedIds.includes(seat.id);
          let stateClass =
            "border-neutral-700 bg-neutral-950 text-neutral-300 hover:border-violet-500";
          if (!seat.isFree) {
            stateClass =
              "cursor-not-allowed border-neutral-800 bg-neutral-800 text-neutral-600";
          } else if (selected) {
            stateClass = "border-violet-400 bg-violet-600 text-white";
          }

          return (
            <button
              key={seat.id}
              type="button"
              disabled={!seat.isFree || isRoom}
              aria-pressed={selected}
              onClick={() => onToggle(seat.id)}
              className={`aspect-square rounded-lg border text-sm font-semibold transition ${stateClass} ${
                isRoom ? "cursor-default" : ""
              }`}
            >
              {seat.number}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-400">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-neutral-700 bg-neutral-950" />
          Свободно
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-violet-600" />
          Выбрано
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-neutral-800" />
          Занято
        </span>
      </div>
    </div>
  );
}
