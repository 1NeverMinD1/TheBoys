import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { useClub } from "@/hooks/useClubs";
import { useCreateBooking, useZoneSeats } from "@/hooks/useBooking";
import {
  addHours,
  calcTotal,
  formatDateLong,
  getNextDays,
  getTariffHours,
  getTimeSlots,
  isValidPhone,
} from "@/lib/booking";
import { pluralize } from "@/lib/format";
import { zoneTypeLabels } from "@/lib/labels";
import { StepCard } from "@/components/booking/StepCard";
import { TariffPicker } from "@/components/booking/TariffPicker";
import { DateTimePicker } from "@/components/booking/DateTimePicker";
import { SeatMap } from "@/components/booking/SeatMap";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { BookingSuccess } from "@/components/booking/BookingSuccess";

const inputClass =
  "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 text-sm outline-none placeholder:text-neutral-500 focus:border-violet-500";

export function BookingPage() {
  const { clubId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: club, isLoading, isError } = useClub(clubId);
  const createBooking = useCreateBooking();

  const days = useMemo(() => getNextDays(7), []);
  const [date, setDate] = useState(days[0].value);
  const [startTime, setStartTime] = useState<string | null>(null);
  const [tariffId, setTariffId] = useState<string | null>(null);
  const [hourlyCount, setHourlyCount] = useState(2);
  const [seatIds, setSeatIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const zone =
    club?.zones.find((item) => item.id === searchParams.get("zone")) ??
    club?.zones[0];
  const tariff =
    zone?.tariffs.find((item) => item.id === tariffId) ?? zone?.tariffs[0];
  const fixedTime = tariff?.kind === "night" ? tariff.timeFrom : null;
  const effectiveStart = fixedTime ?? startTime;
  const slots = useMemo(() => getTimeSlots(date), [date]);
  const seatsQuery = useZoneSeats(club?.id, zone?.id, date, effectiveStart);

  if (isLoading) {
    return (
      <div className="grid animate-pulse gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-40 rounded-2xl bg-neutral-900" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-neutral-900" />
      </div>
    );
  }

  if (isError || !club || !zone || !tariff) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-2 text-2xl font-bold">Бронирование недоступно</h1>
        <p className="mb-6 text-neutral-400">
          Клуб не найден или в нём нет доступных зон
        </p>
        <Link
          to="/clubs"
          className="rounded-lg bg-violet-600 px-5 py-2.5 font-medium hover:bg-violet-500"
        >
          К списку клубов
        </Link>
      </div>
    );
  }

  const isRoom = zone.type === "bootcamp";
  const seats = seatsQuery.data ?? [];
  const roomAvailable =
    isRoom && seats.length > 0 && seats.every((seat) => seat.isFree);
  const bookedSeatIds = isRoom
    ? roomAvailable
      ? seats.map((seat) => seat.id)
      : []
    : seatIds;
  const hours = getTariffHours(tariff, hourlyCount);
  const total = calcTotal(
    tariff,
    hourlyCount,
    isRoom ? 1 : bookedSeatIds.length,
  );

  const seatsLabel = isRoom
    ? roomAvailable
      ? "вся комната"
      : "не выбраны"
    : bookedSeatIds.length > 0
      ? seats
          .filter((seat) => bookedSeatIds.includes(seat.id))
          .map((seat) => `№${seat.number}`)
          .join(", ")
      : "не выбраны";

  const canSubmit =
    Boolean(effectiveStart) &&
    bookedSeatIds.length > 0 &&
    name.trim().length >= 2 &&
    isValidPhone(phone) &&
    !createBooking.isPending;

  if (createBooking.data) {
    return (
      <BookingSuccess
        booking={createBooking.data}
        clubName={club.name}
        zoneName={zone.name}
        seatsLabel={seatsLabel}
      />
    );
  }

  const handleZoneChange = (zoneId: string) => {
    setSearchParams({ zone: zoneId }, { replace: true });
    setTariffId(null);
    setSeatIds([]);
  };

  const handleTariffChange = (id: string) => {
    setTariffId(id);
    setSeatIds([]);
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    setStartTime(null);
    setSeatIds([]);
  };

  const handleTimeChange = (value: string) => {
    setStartTime(value);
    setSeatIds([]);
  };

  const toggleSeat = (seatId: string) => {
    setSeatIds((current) =>
      current.includes(seatId)
        ? current.filter((id) => id !== seatId)
        : [...current, seatId],
    );
  };

  const handleSubmit = () => {
    if (!canSubmit || !effectiveStart) {
      return;
    }
    createBooking.mutate({
      clubId: club.id,
      zoneId: zone.id,
      seatIds: bookedSeatIds,
      date,
      startTime: effectiveStart,
      tariffId: tariff.id,
      hours,
      total,
      customerName: name.trim(),
      customerPhone: phone,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to={`/clubs/${club.id}`}
          className="text-sm text-neutral-400 hover:text-white"
        >
          ← {club.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Бронирование</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <StepCard step={1} title="Зона">
            <div className="flex flex-wrap gap-2">
              {club.zones.map((item) => {
                const active = item.id === zone.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleZoneChange(item.id)}
                    className={`rounded-xl border px-4 py-2.5 text-left transition ${
                      active
                        ? "border-violet-500 bg-violet-600/15"
                        : "border-neutral-800 bg-neutral-950 hover:border-neutral-600"
                    }`}
                  >
                    <span className="block text-sm font-semibold">
                      {item.name}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {zoneTypeLabels[item.type]}
                    </span>
                  </button>
                );
              })}
            </div>
          </StepCard>

          <StepCard step={2} title="Тариф">
            <TariffPicker
              tariffs={zone.tariffs}
              selectedId={tariff.id}
              hourlyCount={hourlyCount}
              onSelect={handleTariffChange}
              onHourlyCountChange={setHourlyCount}
            />
          </StepCard>

          <StepCard step={3} title="Дата и время">
            <DateTimePicker
              days={days}
              date={date}
              slots={slots}
              startTime={startTime}
              fixedTime={fixedTime}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
            />
          </StepCard>

          <StepCard step={4} title={isRoom ? "Комната" : "Места"}>
            {!effectiveStart ? (
              <p className="text-sm text-neutral-400">
                Сначала выбери время, чтобы увидеть свободные места
              </p>
            ) : seatsQuery.isLoading ? (
              <div className="grid animate-pulse grid-cols-5 gap-2 sm:grid-cols-8">
                {Array.from({ length: 16 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-square rounded-lg bg-neutral-800"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <SeatMap
                  seats={seats}
                  selectedIds={bookedSeatIds}
                  isRoom={isRoom}
                  onToggle={toggleSeat}
                />
                {isRoom && (
                  <p
                    className={`text-sm ${roomAvailable ? "text-emerald-300" : "text-red-400"}`}
                  >
                    {roomAvailable
                      ? "Буткемп бронируется целиком, все места ваши"
                      : "Комната на это время занята, выбери другое время"}
                  </p>
                )}
                {!isRoom && seats.every((seat) => !seat.isFree) && (
                  <p className="text-sm text-red-400">
                    На это время свободных мест нет
                  </p>
                )}
                {!isRoom && seatIds.length > 1 && (
                  <p className="text-sm text-neutral-400">
                    Выбрано {seatIds.length}{" "}
                    {pluralize(seatIds.length, ["место", "места", "мест"])},
                    цена умножается на количество мест
                  </p>
                )}
              </div>
            )}
          </StepCard>

          <StepCard step={5} title="Контакты">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Имя"
                autoComplete="name"
                className={inputClass}
              />
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 700 000 00 00"
                autoComplete="tel"
                inputMode="tel"
                className={inputClass}
              />
            </div>
            {phone && !isValidPhone(phone) && (
              <p className="mt-2 text-xs text-amber-300">
                Номер должен содержать 11 цифр
              </p>
            )}
          </StepCard>
        </div>

        <aside>
          <div className="lg:sticky lg:top-24">
            <BookingSummary
              clubName={club.name}
              zoneName={zone.name}
              tariffName={tariff.name}
              dateLabel={formatDateLong(date)}
              timeLabel={
                effectiveStart
                  ? `${effectiveStart} – ${addHours(effectiveStart, hours)}`
                  : null
              }
              hoursLabel={`${hours} ${pluralize(hours, ["час", "часа", "часов"])}`}
              seatsLabel={seatsLabel}
              total={total}
              canSubmit={canSubmit}
              isSubmitting={createBooking.isPending}
              isError={createBooking.isError}
              onSubmit={handleSubmit}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
