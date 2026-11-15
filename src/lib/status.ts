// Is the taproom open? Pure functions: a clock reading and a schedule in, a status out.
// Everything is worked out in the taproom's time zone, never the visitor's.

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const dayOrder: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const dayLabel: Record<DayKey, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

/** One day's hours. Times are 24-hour "HH:MM" in the taproom's time zone. */
export type DayHours =
  | { kind: "open"; opens: string; closes: string }
  | { kind: "private" }
  | { kind: "closed" };

/** A dated change to the weekly hours: a holiday, a buyout on an open night. */
export type HoursException = { date: string; hours: DayHours; reason: string };

export type Schedule = {
  timeZone: string;
  weekly: Record<DayKey, DayHours>;
  exceptions: HoursException[];
  /** How long before closing the status reads "Closing soon". */
  closingSoonMinutes: number;
};

export type NextOpening = { isoDate: string; dayKey: DayKey; opens: string; isToday: boolean };

export type Status =
  | { state: "open" | "soon"; closes: string }
  | { state: "private" | "closed"; opensNext: NextOpening | null };

/** How far ahead to look for the next opening before giving up. */
const LOOKAHEAD_DAYS = 14;

const toMinutes = (clock: string): number => {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * 60 + minutes;
};

const weekdayToKey: Record<string, DayKey> = {
  Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "sat", Sun: "sun",
};

/** The calendar date, weekday and minutes past midnight at this instant in a time zone. */
export function localMoment(now: Date, timeZone: string): { isoDate: string; dayKey: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return {
    isoDate: `${part("year")}-${part("month")}-${part("day")}`,
    dayKey: weekdayToKey[part("weekday")],
    minutes: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

/** The calendar date `days` after an ISO date. Calendar arithmetic only, so no time zone is involved. */
function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

/** The hours that apply on a date: a dated exception if there is one, otherwise the weekly hours. */
export function hoursOn(isoDate: string, dayKey: DayKey, schedule: Schedule): DayHours {
  return schedule.exceptions.find((exception) => exception.date === isoDate)?.hours ?? schedule.weekly[dayKey];
}

function nextOpening(isoDate: string, dayKey: DayKey, minutes: number, schedule: Schedule): NextOpening | null {
  const startIndex = dayOrder.indexOf(dayKey);
  for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset += 1) {
    const candidateDate = addDays(isoDate, offset);
    const candidateDay = dayOrder[(startIndex + offset) % dayOrder.length];
    const hours = hoursOn(candidateDate, candidateDay, schedule);
    if (hours.kind !== "open") continue;
    // Today only counts if opening time is still ahead.
    if (offset === 0 && minutes >= toMinutes(hours.opens)) continue;
    return { isoDate: candidateDate, dayKey: candidateDay, opens: hours.opens, isToday: offset === 0 };
  }
  return null;
}

/** The taproom's status at an instant. */
export function statusAt(now: Date, schedule: Schedule): Status {
  const { isoDate, dayKey, minutes } = localMoment(now, schedule.timeZone);
  const today = hoursOn(isoDate, dayKey, schedule);

  if (today.kind === "open") {
    const opens = toMinutes(today.opens);
    const closes = toMinutes(today.closes);
    if (minutes >= opens && minutes < closes) {
      const state = closes - minutes <= schedule.closingSoonMinutes ? "soon" : "open";
      return { state, closes: today.closes };
    }
  }

  const opensNext = nextOpening(isoDate, dayKey, minutes, schedule);
  return { state: today.kind === "private" ? "private" : "closed", opensNext };
}

/** "16:00" to "4 PM", "19:30" to "7:30 PM". Midnight is written as a word. */
export function formatClock(clock: string): string {
  const total = toMinutes(clock) % (24 * 60);
  if (total === 0) return "midnight";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  const suffix = hours < 12 ? "AM" : "PM";
  return `${hour12}${minutes === 0 ? "" : `:${String(minutes).padStart(2, "0")}`} ${suffix}`;
}

/** "16:00" and "20:00" to "4–8 PM". AM or PM is written once when both ends share it. */
export function formatRange(opens: string, closes: string): string {
  const start = formatClock(opens);
  const end = formatClock(closes);
  const [startTime, startSuffix] = start.split(" ");
  const [, endSuffix] = end.split(" ");
  return startSuffix && startSuffix === endSuffix ? `${startTime}–${end}` : `${start}–${end}`;
}

export const statusLabel: Record<Status["state"], string> = {
  open: "Open",
  soon: "Closing soon",
  private: "Private event",
  closed: "Closed",
};

/** The exact words for the pill and the line beside it. */
export function describeStatus(status: Status): { label: string; detail: string } {
  const label = statusLabel[status.state];
  if ("closes" in status) {
    const verb = status.state === "open" ? "until" : "closes";
    return { label, detail: `${verb} ${formatClock(status.closes)}` };
  }
  if (!status.opensNext) return { label, detail: "" };
  const { dayKey, opens, isToday } = status.opensNext;
  return { label, detail: isToday ? `opens ${formatClock(opens)}` : `opens ${dayLabel[dayKey]} ${formatClock(opens)}` };
}

/** One day's hours as the hours table shows them: "4–8 PM", "Private events" or "Closed". */
export function hoursText(hours: DayHours): string {
  if (hours.kind === "open") return formatRange(hours.opens, hours.closes);
  return hours.kind === "private" ? "Private events" : "Closed";
}

export type WeekGroup = { days: string; text: string; kind: DayHours["kind"] };

/** The week in as few lines as it takes: neighbouring days with the same hours share a line. Monday first. */
export function summarizeWeek(weekly: Record<DayKey, DayHours>): WeekGroup[] {
  const runs: { first: DayKey; last: DayKey; length: number; hours: DayHours }[] = [];
  for (const day of dayOrder) {
    const hours = weekly[day];
    const run = runs.at(-1);
    if (run && hoursText(run.hours) === hoursText(hours)) {
      run.last = day;
      run.length += 1;
    } else {
      runs.push({ first: day, last: day, length: 1, hours });
    }
  }
  return runs.map((run) => {
    const first = dayLabel[run.first];
    const last = dayLabel[run.last];
    const days = run.length === 1 ? first : run.length === 2 ? `${first}, ${last}` : `${first}–${last}`;
    return { days, text: hoursText(run.hours), kind: run.hours.kind };
  });
}
