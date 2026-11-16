// Talking to the live database, and what the public site may read from it.
// Kept free of the portal's sample data so public pages stay light.
import { weeklyHours } from "../content/hours.ts";
import { dayOrder, type DayHours, type HoursException, type Schedule } from "./status.ts";

/** Where the live ledger is. Both values are public: the key only reaches the `colonymash_*` functions. */
export type LiveConfig = { url: string; key: string };
export function liveConfig(url: string | undefined, key: string | undefined): LiveConfig | null {
  const clean = (url ?? "").trim().replace(/\/+$/, "");
  return /^https?:\/\/[^\s/]+/.test(clean) && (key ?? "").trim().length >= 20 ? { url: clean, key: key!.trim() } : null;
}

/** The HTTP request for one database function. */
export function rpcRequest(config: LiveConfig, name: string, args: Record<string, unknown>): { url: string; init: RequestInit } {
  return {
    url: config.url + "/rest/v1/rpc/colonymash_" + name,
    init: { method: "POST", headers: { apikey: config.key, "Content-Type": "application/json" }, body: JSON.stringify(args), cache: "no-store" },
  };
}

export type RpcReply = { ok?: boolean; reason?: string } & Record<string, unknown>;
/** Call a database function. Throws when the network or the server fails, so callers can tell "refused" from "unreachable". */
export async function callRpc<T = RpcReply>(config: LiveConfig, name: string, args: Record<string, unknown>, fetcher: typeof fetch = fetch): Promise<T> {
  const { url, init } = rpcRequest(config, name, args);
  const response = await fetcher(url, init);
  if (!response.ok) throw new Error("The database answered " + response.status + ".");
  return await response.json() as T;
}

const shift = (iso: string, days: number) => {
  const date = new Date(iso + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const validDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(new Date(value + "T12:00:00Z").getTime());
const validClock = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const sameHours = (a: DayHours, b: DayHours) =>
  a.kind === b.kind && (a.kind !== "open" || (b.kind === "open" && a.opens === b.opens && a.closes === b.closes));

/**
 * Turn the staff's week-by-week changes into the dated exceptions the public hours already understand.
 * Only days that differ from the usual week, or carry a note, become exceptions. Bad data is skipped:
 * this reads what a database returned, so it trusts nothing.
 */
export function weekExceptions(weekHours: unknown, fromDate = ""): HoursException[] {
  if (!weekHours || typeof weekHours !== "object") return [];
  const found: HoursException[] = [];
  for (const [weekStart, days] of Object.entries(weekHours as Record<string, unknown>)) {
    if (!validDay(weekStart) || !Array.isArray(days) || days.length !== 7) continue;
    days.forEach((raw, index) => {
      const day = raw as { kind?: string; opens?: string; closes?: string; note?: unknown } | null;
      if (!day || !["open", "closed", "private"].includes(String(day.kind))) return;
      if (day.kind === "open" && (!validClock(day.opens) || !validClock(day.closes) || day.closes! <= day.opens!)) return;
      const hours: DayHours = day.kind === "open" ? { kind: "open", opens: day.opens!, closes: day.closes! } : { kind: day.kind as "closed" | "private" };
      const note = typeof day.note === "string" ? day.note.trim().slice(0, 120) : "";
      const date = shift(weekStart, index);
      if (date < fromDate || (sameHours(hours, weeklyHours[dayOrder[index]]) && !note)) return;
      found.push({ date, hours, reason: note || "Hours changed this week" });
    });
  }
  return found.sort((a, b) => a.date.localeCompare(b.date));
}

/** The site's schedule with the staff's changes laid over it. A staff change wins over one in the hours file. */
export function withExceptions(schedule: Schedule, extra: HoursException[]): Schedule {
  if (!extra.length) return schedule;
  const dates = new Set(extra.map(x => x.date));
  return { ...schedule, exceptions: [...schedule.exceptions.filter(x => !dates.has(x.date)), ...extra].sort((a, b) => a.date.localeCompare(b.date)) };
}

export type PublicEvent = { id: string; title: string; date: string; start: string; end: string; note: string };
/** Listed events as the public site may show them. Anything malformed is dropped. */
export function publicEvents(raw: unknown, fromDate = ""): PublicEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((value): PublicEvent[] => {
    const event = value as Partial<PublicEvent> | null;
    if (!event || typeof event.title !== "string" || !event.title.trim() || typeof event.date !== "string" || !validDay(event.date) ||
      !validClock(event.start) || !validClock(event.end) || event.date < fromDate) return [];
    return [{ id: String(event.id ?? event.date + event.title), title: event.title.trim().slice(0, 80), date: event.date,
      start: event.start!, end: event.end!, note: typeof event.note === "string" ? event.note.slice(0, 240) : "" }];
  }).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).slice(0, 12);
}
