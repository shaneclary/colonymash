import {
  demoProducts, packLabels, requestKindLabels, type DemoState,
} from "../content/portal-demo.ts";
import { ingredientForecast } from "./portal-forecast.ts";

export type CalendarKind = "order" | "batch" | "event" | "request" | "follow-up" | "purchase";
export type CalendarEntry = {
  id: string; date: string; kind: CalendarKind; title: string; detail: string;
  /** "HH:MM" when the entry has set hours. All-day when missing. */
  start?: string; end?: string;
  /** Not confirmed yet: a requested order or a request nobody has answered. */
  tentative: boolean;
};

const productName = (id: string) => demoProducts.find(x => x.id === id)?.name ?? id;
const shift = (iso: string, days: number) => {
  const date = new Date(iso + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Everything staff have a date for: orders, brew days, events, requests, follow-ups, ingredient buys. */
export function calendarEntries(state: DemoState, today: string): CalendarEntry[] {
  const orders = state.orders.filter(x => ["requested", "accepted", "scheduled"].includes(x.status)).map((order): CalendarEntry => ({
    id: "order-" + order.id, kind: "order", date: order.slot?.date ?? order.neededBy, tentative: order.status !== "scheduled",
    title: (order.slot ? (order.slot.method === "pickup" ? "Pickup: " : "Delivery: ") : "Order wanted: ") + order.merchantName,
    detail: [order.id + " (" + order.status + ")", order.slot?.window ?? "",
      order.lines.map(x => x.quantity + " " + packLabels[x.format].toLowerCase() + " " + productName(x.productId)).join(", ")].filter(Boolean).join(". "),
  }));
  const batches = state.batches.filter(x => x.status === "planned").map((batch): CalendarEntry => ({
    id: "batch-" + batch.id, kind: "batch", date: batch.date, tentative: false,
    title: "Brew: " + batch.name, detail: batch.batchLiters + " L. " + batch.notes,
  }));
  const events = state.events.map((event): CalendarEntry => ({
    id: "event-" + event.id, kind: "event", date: event.date, start: event.start, end: event.end, tentative: false,
    title: event.title, detail: event.note,
  }));
  const requests = state.requests.filter(x => x.status === "new" || x.status === "approved").map((request): CalendarEntry => ({
    id: "request-" + request.id, kind: "request", date: request.date, tentative: request.status === "new",
    title: requestKindLabels[request.kind] + ": " + request.from,
    detail: [request.guests ? request.guests + " guests" : "", request.productIds.map(productName).join(", "), request.notes].filter(Boolean).join(". "),
  }));
  const followUps = state.accounts.filter(x => x.followUpOn).map((account): CalendarEntry => ({
    id: "follow-" + account.id, kind: "follow-up", date: account.followUpOn, tentative: false,
    title: "Follow up: " + account.name, detail: [account.contactName, account.phone].filter(Boolean).join(", "),
  }));
  const purchases = ingredientForecast(state, today).filter(x => x.suggestedOrder > 0).map((need): CalendarEntry => ({
    id: "buy-" + need.item.id, kind: "purchase", tentative: false,
    date: need.reorderBy && need.reorderBy > today ? need.reorderBy : today,
    title: "Order ingredient: " + need.item.name,
    detail: Number(need.suggestedOrder.toFixed(2)) + " " + need.item.unit + (need.item.supplier ? " from " + need.item.supplier : ""),
  }));
  return [...orders, ...batches, ...events, ...requests, ...followUps, ...purchases]
    .sort((a, b) => (a.date + (a.start ?? "")).localeCompare(b.date + (b.start ?? "")) || a.title.localeCompare(b.title));
}

/** Weeks of a month, Monday first, padded with the days around it. `month` is 1 to 12. */
export function monthGrid(year: number, month: number): string[][] {
  const first = new Date(Date.UTC(year, month - 1, 1, 12));
  const start = shift(first.toISOString().slice(0, 10), -((first.getUTCDay() + 6) % 7));
  const lastDay = new Date(Date.UTC(year, month, 0, 12)).toISOString().slice(0, 10);
  const weeks: string[][] = [];
  for (let day = start; day <= lastDay; day = shift(day, 7)) weeks.push(Array.from({ length: 7 }, (_, i) => shift(day, i)));
  return weeks;
}

const compact = (iso: string) => iso.replaceAll("-", "");
const clock = (time: string) => time.replace(":", "") + "00";
const escapeText = (text: string) => text.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** Calendar lines may not run past 75 octets. Continuations start with a space. */
const fold = (line: string) => {
  const parts: string[] = [];
  let rest = line;
  while (new TextEncoder().encode(rest).length > 75) {
    let cut = 74;
    while (new TextEncoder().encode(rest.slice(0, cut)).length > 74) cut -= 1;
    parts.push(rest.slice(0, cut));
    rest = " " + rest.slice(cut);
  }
  return [...parts, rest].join("\r\n");
};

/**
 * An iCalendar file. Apple Calendar, Google Calendar and Outlook all import it.
 * Timed entries are written as local ("floating") times, so they show at the same clock time anywhere.
 * `stamp` is the creation time as YYYYMMDDTHHMMSSZ.
 */
export function toIcs(entries: readonly CalendarEntry[], stamp: string): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Colony Mash//Operations demo//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const entry of entries) {
    lines.push("BEGIN:VEVENT", "UID:" + entry.id + "@colonymash.demo", "DTSTAMP:" + stamp);
    if (entry.start && entry.end) lines.push("DTSTART:" + compact(entry.date) + "T" + clock(entry.start), "DTEND:" + compact(entry.date) + "T" + clock(entry.end));
    else lines.push("DTSTART;VALUE=DATE:" + compact(entry.date), "DTEND;VALUE=DATE:" + compact(shift(entry.date, 1)));
    lines.push("SUMMARY:" + escapeText((entry.tentative ? "(Unconfirmed) " : "") + entry.title));
    if (entry.detail.trim()) lines.push("DESCRIPTION:" + escapeText(entry.detail.trim()));
    if (entry.tentative) lines.push("STATUS:TENTATIVE");
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** A link that opens Google Calendar with this entry filled in, ready to save. */
export function googleCalendarUrl(entry: CalendarEntry): string {
  const dates = entry.start && entry.end
    ? compact(entry.date) + "T" + clock(entry.start) + "/" + compact(entry.date) + "T" + clock(entry.end)
    : compact(entry.date) + "/" + compact(shift(entry.date, 1));
  const query = new URLSearchParams({
    action: "TEMPLATE", text: (entry.tentative ? "(Unconfirmed) " : "") + entry.title, dates, details: entry.detail.trim(),
    ...(entry.start ? { ctz: "America/Los_Angeles" } : {}),
  });
  return "https://calendar.google.com/calendar/render?" + query.toString();
}
