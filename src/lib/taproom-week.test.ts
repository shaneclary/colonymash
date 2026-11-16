import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed } from "../content/portal-demo.ts";
import {
  dayHoursText, removeEvent, resetWeek, saveEvent, setWeekDay, standardWeek, upcomingEvents, weekDates, weekFor, weekStartOf,
} from "./taproom-week.ts";

const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const week = "2026-11-16"; // a Monday

test("a week starts on Monday and has seven dates", () => {
  assert.equal(weekStartOf("2026-11-16"), "2026-11-16");
  assert.equal(weekStartOf("2026-11-15"), "2026-11-09"); // Sunday belongs to the week before
  assert.equal(weekStartOf("2026-11-22"), "2026-11-16");
  assert.equal(weekStartOf("not a date"), "");
  assert.deepEqual(weekDates(week), ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"]);
});

test("the usual week comes from the site's hours file", () => {
  const days = standardWeek();
  assert.deepEqual(days.map(x => x.kind), ["closed", "closed", "closed", "open", "open", "private", "open"]);
  assert.deepEqual(days.map(dayHoursText), ["Closed", "Closed", "Closed", "4–8 PM", "4–8 PM", "Private events", "3–7 PM"]);
  assert.deepEqual(weekFor(seed, week), { days, changed: false });
});

test("one week's hours change without touching the usual week or other weeks", () => {
  let state = setWeekDay(seed, week, 3, { kind: "closed", note: "Thanksgiving" }).state;
  state = setWeekDay(state, week, 2, { kind: "open", opens: "15:00", closes: "21:00" }).state;
  const changed = weekFor(state, week);
  assert.equal(changed.changed, true);
  assert.deepEqual(changed.days.map(dayHoursText), ["Closed", "Closed", "3–9 PM", "Closed", "4–8 PM", "Private events", "3–7 PM"]);
  assert.equal(changed.days[3].note, "Thanksgiving");
  assert.equal(weekFor(state, "2026-11-23").changed, false);
  assert.equal(weekFor(resetWeek(state, week), week).changed, false);
  assert.equal(resetWeek(seed, week), seed);
});

test("hours changes are checked", () => {
  assert.ok(setWeekDay(seed, week, 3, { kind: "open", opens: "20:00", closes: "16:00" }).error);
  assert.ok(setWeekDay(seed, week, 3, { opens: "4pm" }).error);
  assert.ok(setWeekDay(seed, week, 7, { kind: "closed" }).error);
  assert.ok(setWeekDay(seed, "2026-11-17", 0, { kind: "closed" }).error); // not a Monday
  assert.equal(setWeekDay(seed, week, 3, { opens: "4pm" }).state, seed);
});

test("special events add, edit, list in date order and remove", () => {
  const input = { title: " Seltzer release ", date: "2026-11-28", start: "12:00", end: "17:00", note: "Two new flavors.", listed: true };
  const added = saveEvent(seed, input, "EV-2");
  assert.equal(added.error, undefined);
  assert.equal(added.state.events.length, 2);
  assert.equal(added.state.events.at(-1)?.title, "Seltzer release");
  const edited = saveEvent(added.state, { ...input, date: "2026-11-17", listed: false }, "EV-2").state;
  assert.equal(edited.events.length, 2);
  assert.deepEqual(upcomingEvents(edited, "2026-11-15").map(x => x.id), ["EV-2", "DEMO-EV1"]);
  assert.deepEqual(upcomingEvents(edited, "2026-11-18").map(x => x.id), ["DEMO-EV1"]);
  assert.equal(removeEvent(edited, "EV-2").events.length, 1);
  assert.equal(removeEvent(seed, "missing"), seed);
  assert.ok(saveEvent(seed, { ...input, title: "" }, "EV-2").error);
  assert.ok(saveEvent(seed, { ...input, end: "11:00" }, "EV-2").error);
  assert.ok(saveEvent(seed, { ...input, date: "soon" }, "EV-2").error);
});
