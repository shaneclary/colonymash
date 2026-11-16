import { type DemoState, type SpecialEvent, type WeekDay } from "../content/portal-demo.ts";
import { weeklyHours } from "../content/hours.ts";
import { dayOrder, formatRange } from "./status.ts";

export type WeekResult = { state: DemoState; error?: string };
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const validClock = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const shift = (iso: string, days: number) => {
  const date = new Date(iso + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** The Monday of the week a date falls in. */
export function weekStartOf(iso: string): string {
  if (!validDay(iso)) return "";
  const weekday = new Date(iso + "T12:00:00Z").getUTCDay(); // 0 is Sunday
  return shift(iso, -((weekday + 6) % 7));
}
export const weekDates = (weekStart: string): string[] => dayOrder.map((_, index) => shift(weekStart, index));

/** The usual week, Monday first, from the site's own hours file. */
export function standardWeek(): WeekDay[] {
  return dayOrder.map((key): WeekDay => {
    const hours = weeklyHours[key];
    return hours.kind === "open" ? { kind: "open", opens: hours.opens, closes: hours.closes, note: "" }
      : { kind: hours.kind === "private" ? "private" : "closed", opens: "16:00", closes: "20:00", note: "" };
  });
}

/** Hours for one week: the staff's change for that week if there is one, else the usual week. */
export function weekFor(state: DemoState, weekStart: string): { days: WeekDay[]; changed: boolean } {
  const saved = state.weekHours[weekStart];
  return saved?.length === 7 ? { days: saved, changed: true } : { days: standardWeek(), changed: false };
}

export function setWeekDay(state: DemoState, weekStart: string, index: number, patch: Partial<WeekDay>): WeekResult {
  if (weekStartOf(weekStart) !== weekStart || !Number.isSafeInteger(index) || index < 0 || index > 6)
    return { state, error: "Choose a day in that week." };
  const days = weekFor(state, weekStart).days;
  const next: WeekDay = { ...days[index], ...patch, note: (patch.note ?? days[index].note).slice(0, 120) };
  if (!["open", "closed", "private"].includes(next.kind)) return { state, error: "Choose open, closed or private." };
  if (!validClock(next.opens) || !validClock(next.closes)) return { state, error: "Enter times as hours and minutes." };
  if (next.kind === "open" && next.closes <= next.opens) return { state, error: "Closing time must be after opening time." };
  return { state: { ...state, weekHours: { ...state.weekHours, [weekStart]: days.map((day, i) => i === index ? next : day) } } };
}

/** Drop a week's changes and go back to the usual hours. */
export function resetWeek(state: DemoState, weekStart: string): DemoState {
  if (!(weekStart in state.weekHours)) return state;
  const { [weekStart]: _dropped, ...rest } = state.weekHours;
  return { ...state, weekHours: rest };
}

export const dayHoursText = (day: WeekDay): string =>
  day.kind === "open" ? formatRange(day.opens, day.closes) : day.kind === "private" ? "Private events" : "Closed";

export type EventInput = Omit<SpecialEvent, "id">;

/** Add an event, or update the one with this id. */
export function saveEvent(state: DemoState, input: EventInput, id: string): WeekResult {
  const title = input.title.trim().replace(/\s+/g, " ").slice(0, 80);
  if (title.length < 2) return { state, error: "Name the event." };
  if (!validDay(input.date)) return { state, error: "Choose the event date." };
  if (!validClock(input.start) || !validClock(input.end) || input.end <= input.start)
    return { state, error: "The end time must be after the start time." };
  if (!id) return { state, error: "This event cannot be saved." };
  const event: SpecialEvent = { id, title, date: input.date, start: input.start, end: input.end,
    note: input.note.trim().slice(0, 240), listed: Boolean(input.listed) };
  if (state.events.some(x => x.id === id)) return { state: { ...state, events: state.events.map(x => x.id === id ? event : x) } };
  if (state.events.length >= 200) return { state, error: "This event cannot be saved." };
  return { state: { ...state, events: [...state.events, event] } };
}

export function removeEvent(state: DemoState, id: string): DemoState {
  return state.events.some(x => x.id === id) ? { ...state, events: state.events.filter(x => x.id !== id) } : state;
}

export const upcomingEvents = (state: DemoState, today: string): SpecialEvent[] =>
  state.events.filter(x => x.date >= today).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
