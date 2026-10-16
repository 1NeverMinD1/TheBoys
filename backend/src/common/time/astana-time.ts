/**
 * Всё время в системе — по Астане (UTC+5, без перехода на летнее время).
 *
 * Фронт присылает «дату» и «время» отдельно: date = "2026-10-15", startTime = "21:00".
 * Это время по Астане. В базе мы храним точные моменты (timestamptz),
 * поэтому сразу переводим пару дата+время в настоящий момент времени.
 */
export const ASTANA_OFFSET = '+05:00';
const OFFSET_MS = 5 * 60 * 60 * 1000;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const isDateString = (v: string) => DATE_RE.test(v);
export const isTimeString = (v: string) => TIME_RE.test(v);

/** "2026-10-15" + "21:00" → Date (момент 21:00 по Астане) */
export function toInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00${ASTANA_OFFSET}`);
}

export function addHoursToDate(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

/** Date → "2026-10-15" (какая это дата в Астане) */
export function toAstanaDate(d: Date): string {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

/** Date → "21:00" (сколько времени в Астане) */
export function toAstanaTime(d: Date): string {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(11, 16);
}

/** "21:30" → 1290 (минут с полуночи) */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Укладывается ли сеанс в часы работы клуба.
 *
 * Хитрость: клуб может работать «через полночь» (10:00–04:00).
 * Тогда рабочее окно — это [10:00; 28:00) в минутах. А сеанс, который
 * начинается в 02:00, относится к окну ПРЕДЫДУЩЕГО дня: [-14:00; 04:00).
 * Поэтому проверяем оба окна — «сегодняшнее» и «вчерашнее».
 */
export function fitsWorkingHours(
  hours: { open: string; close: string; is24h: boolean },
  startTime: string,
  durationHours: number,
): boolean {
  if (hours.is24h) return true;

  const open = timeToMinutes(hours.open);
  let close = timeToMinutes(hours.close);
  if (close <= open) close += 24 * 60; // работает через полночь

  const start = timeToMinutes(startTime);
  const end = start + durationHours * 60;

  const windows = [
    [open, close],
    [open - 24 * 60, close - 24 * 60],
  ];
  return windows.some(([from, to]) => start >= from && end <= to);
}
