import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed } from "../content/portal-demo.ts";
import { calendarEntries, googleCalendarUrl, monthGrid, toIcs } from "./staff-calendar.ts";
import { scheduleOrder } from "./order-schedule.ts";
import { decideRequest } from "./staff-requests.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const entries = calendarEntries(seed, today);
const find = (list: typeof entries, id: string) => list.find(x => x.id === id);

test("the calendar gathers orders, brew days, events, requests, follow-ups and ingredient buys", () => {
  assert.deepEqual([...new Set(entries.map(x => x.kind))].sort(), ["batch", "event", "follow-up", "order", "purchase", "request"]);
  assert.deepEqual(entries.map(x => x.date), [...entries.map(x => x.date)].sort());
  assert.equal(find(entries, "batch-DEMO-B3")?.date, "2026-11-23");
  assert.deepEqual([find(entries, "event-DEMO-EV1")?.start, find(entries, "event-DEMO-EV1")?.end], ["16:00", "20:00"]);
  assert.equal(find(entries, "follow-coastal-partner-demo")?.date, "2026-11-18");
  assert.equal(find(entries, "order-DEMO-0998"), undefined); // filled orders are off the calendar
});

test("an order sits on its wanted date until scheduled, then on its slot", () => {
  const wanted = find(entries, "order-DEMO-1001");
  assert.deepEqual([wanted?.date, wanted?.tentative, wanted?.title], ["2026-11-21", true, "Order wanted: Coastal Partner — Demo"]);
  const moved = scheduleOrder(seed, "DEMO-1001", { date: "2026-11-19", method: "pickup", window: "Afternoon" }, today).state;
  const slot = find(calendarEntries(moved, today), "order-DEMO-1001");
  assert.deepEqual([slot?.date, slot?.tentative, slot?.title], ["2026-11-19", false, "Pickup: Coastal Partner — Demo"]);
  assert.match(slot?.detail ?? "", /Afternoon/);
});

test("unanswered requests are tentative, declined ones drop off", () => {
  assert.equal(find(entries, "request-DEMO-RQ1")?.tentative, true);
  assert.equal(find(entries, "request-DEMO-RQ3")?.tentative, false);
  const declined = calendarEntries(decideRequest(seed, "DEMO-RQ1", "declined"), today);
  assert.equal(find(declined, "request-DEMO-RQ1"), undefined);
});

test("an overdue ingredient buy lands on today, never in the past", () => {
  const buys = entries.filter(x => x.kind === "purchase");
  assert.ok(buys.length > 0);
  assert.ok(buys.every(x => x.date >= today));
});

test("a month grid runs Monday to Sunday and covers the whole month", () => {
  const november = monthGrid(2026, 11);
  assert.equal(november[0][0], "2026-10-26");
  assert.equal(november.at(-1)?.[6], "2026-12-06");
  assert.ok(november.every(week => week.length === 7));
  assert.equal(november.flat().filter(x => x.startsWith("2026-11")).length, 30);
  assert.equal(monthGrid(2027, 2).length, 4); // February 2027 starts on a Monday
});

test("the calendar file is valid iCalendar for Apple, Google and Outlook", () => {
  const ics = toIcs([find(entries, "event-DEMO-EV1")!, find(entries, "batch-DEMO-B3")!, find(entries, "request-DEMO-RQ1")!], "20261115T200000Z");
  const lines = ics.split("\r\n");
  assert.equal(lines[0], "BEGIN:VCALENDAR");
  assert.equal(lines.at(-2), "END:VCALENDAR");
  assert.equal(lines.filter(x => x === "BEGIN:VEVENT").length, 3);
  assert.ok(lines.includes("DTSTART:20261119T160000") && lines.includes("DTEND:20261119T200000")); // timed event
  assert.ok(lines.includes("DTSTART;VALUE=DATE:20261123") && lines.includes("DTEND;VALUE=DATE:20261124")); // all-day brew
  assert.ok(lines.includes("STATUS:TENTATIVE"));
  assert.ok(lines.includes("UID:event-DEMO-EV1@colonymash.demo"));
  assert.ok(lines.every(x => new TextEncoder().encode(x).length <= 75));
  assert.equal(ics.includes("\n\n"), false);
});

test("calendar text is escaped and long lines are folded", () => {
  const ics = toIcs([{ id: "x", date: "2026-11-20", kind: "event", tentative: false,
    title: "Kegs, cans; and more", detail: "Line one\nLine two " + "long ".repeat(30) }], "20261115T200000Z");
  assert.match(ics, /SUMMARY:Kegs\\, cans\; and more/);
  assert.match(ics, /DESCRIPTION:Line one\\nLine two/);
  assert.match(ics, /\r\n /); // folded continuation starts with a space
});

test("the Google link carries the title, the dates and the details", () => {
  const timed = new URL(googleCalendarUrl(find(entries, "event-DEMO-EV1")!));
  assert.equal(timed.origin + timed.pathname, "https://calendar.google.com/calendar/render");
  assert.equal(timed.searchParams.get("action"), "TEMPLATE");
  assert.equal(timed.searchParams.get("text"), "Sample release night");
  assert.equal(timed.searchParams.get("dates"), "20261119T160000/20261119T200000");
  assert.equal(timed.searchParams.get("ctz"), "America/Los_Angeles");
  const allDay = new URL(googleCalendarUrl(find(entries, "batch-DEMO-B3")!));
  assert.equal(allDay.searchParams.get("dates"), "20261123/20261124");
  assert.equal(allDay.searchParams.get("ctz"), null);
});
