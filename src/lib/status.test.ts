// Is the taproom open? Every case the StatusPill has to get right.
import { test } from "node:test";
import assert from "node:assert/strict";
import { describeStatus, formatClock, formatRange, hoursText, localMoment, statusAt, summarizeWeek, type Schedule } from "./status.ts";

// The real week as of Nov 2026 (Instagram bio): Thu and Fri 4-8, Sat private, Sun 3-7.
const schedule: Schedule = {
  timeZone: "America/Los_Angeles",
  closingSoonMinutes: 60,
  weekly: {
    mon: { kind: "closed" },
    tue: { kind: "closed" },
    wed: { kind: "closed" },
    thu: { kind: "open", opens: "16:00", closes: "20:00" },
    fri: { kind: "open", opens: "16:00", closes: "20:00" },
    sat: { kind: "private" },
    sun: { kind: "open", opens: "15:00", closes: "19:00" },
  },
  exceptions: [],
};

// November 2026 is Pacific Standard Time, UTC-8.
const pacific = (isoLocal: string) => new Date(`${isoLocal}:00-08:00`);

test("localMoment reads the clock in the taproom's time zone, not the visitor's", () => {
  // 07:30 UTC on Monday is still 11:30 PM Sunday in Atascadero.
  assert.deepEqual(localMoment(new Date("2026-11-16T07:30:00Z"), "America/Los_Angeles"), {
    isoDate: "2026-11-15",
    dayKey: "sun",
    minutes: 23 * 60 + 30,
  });
});

test("open in the middle of a session", () => {
  assert.deepEqual(statusAt(pacific("2026-11-15T16:10"), schedule), { state: "open", closes: "19:00" });
});

test("open from the first minute", () => {
  assert.equal(statusAt(pacific("2026-11-15T15:00"), schedule).state, "open");
});

test("closing soon starts exactly 60 minutes before close", () => {
  assert.equal(statusAt(pacific("2026-11-15T17:59"), schedule).state, "open");
  assert.deepEqual(statusAt(pacific("2026-11-15T18:00"), schedule), { state: "soon", closes: "19:00" });
  assert.equal(statusAt(pacific("2026-11-15T18:59"), schedule).state, "soon");
});

test("closed at closing time, and the next opening skips the closed days", () => {
  assert.deepEqual(statusAt(pacific("2026-11-15T19:00"), schedule), {
    state: "closed",
    opensNext: { isoDate: "2026-11-19", dayKey: "thu", opens: "16:00", isToday: false },
  });
});

test("closed before opening on an open day points at today", () => {
  assert.deepEqual(statusAt(pacific("2026-11-15T14:00"), schedule), {
    state: "closed",
    opensNext: { isoDate: "2026-11-15", dayKey: "sun", opens: "15:00", isToday: true },
  });
});

test("closed on a Monday points at Thursday", () => {
  const status = statusAt(pacific("2026-11-16T12:00"), schedule);
  assert.equal(status.state, "closed");
  assert.deepEqual(status.state === "closed" && status.opensNext, {
    isoDate: "2026-11-19",
    dayKey: "thu",
    opens: "16:00",
    isToday: false,
  });
});

test("Saturday is a private event all day, and points at Sunday", () => {
  assert.deepEqual(statusAt(pacific("2026-11-14T12:00"), schedule), {
    state: "private",
    opensNext: { isoDate: "2026-11-15", dayKey: "sun", opens: "15:00", isToday: false },
  });
});

test("Friday after close skips the private Saturday", () => {
  const status = statusAt(pacific("2026-11-13T20:30"), schedule);
  assert.deepEqual(status, {
    state: "closed",
    opensNext: { isoDate: "2026-11-15", dayKey: "sun", opens: "15:00", isToday: false },
  });
});

test("a dated exception beats the weekly hours", () => {
  const withThanksgiving: Schedule = {
    ...schedule,
    exceptions: [{ date: "2026-11-26", hours: { kind: "closed" }, reason: "Thanksgiving" }],
  };
  // Thursday the 26th would normally be open at 5 PM.
  assert.deepEqual(statusAt(pacific("2026-11-26T17:00"), withThanksgiving), {
    state: "closed",
    opensNext: { isoDate: "2026-11-27", dayKey: "fri", opens: "16:00", isToday: false },
  });
});

test("an exception can open a normally closed day", () => {
  const withMonday: Schedule = {
    ...schedule,
    exceptions: [{ date: "2026-11-16", hours: { kind: "open", opens: "12:00", closes: "18:00" }, reason: "Holiday hours" }],
  };
  assert.deepEqual(statusAt(pacific("2026-11-16T13:00"), withMonday), { state: "open", closes: "18:00" });
});

test("daylight saving time does not shift the hours", () => {
  // Sunday March 8, 2026 is the first day of PDT (UTC-7). 3:30 PM local is 22:30 UTC.
  assert.equal(statusAt(new Date("2026-03-08T22:30:00Z"), schedule).state, "open");
  // 2:30 PM local, half an hour before opening.
  assert.equal(statusAt(new Date("2026-03-08T21:30:00Z"), schedule).state, "closed");
});

test("no opening in the next two weeks gives no next opening", () => {
  const shut: Schedule = {
    ...schedule,
    weekly: {
      mon: { kind: "closed" }, tue: { kind: "closed" }, wed: { kind: "closed" }, thu: { kind: "closed" },
      fri: { kind: "closed" }, sat: { kind: "closed" }, sun: { kind: "closed" },
    },
  };
  assert.deepEqual(statusAt(pacific("2026-11-15T16:00"), shut), { state: "closed", opensNext: null });
});

test("formatClock writes 12-hour times the way the style guide does", () => {
  assert.equal(formatClock("16:00"), "4 PM");
  assert.equal(formatClock("19:30"), "7:30 PM");
  assert.equal(formatClock("09:05"), "9:05 AM");
  assert.equal(formatClock("12:00"), "12 PM");
  assert.equal(formatClock("00:00"), "midnight");
  assert.equal(formatClock("24:00"), "midnight");
});

test("formatRange shares AM or PM when both ends have it", () => {
  assert.equal(formatRange("16:00", "20:00"), "4–8 PM");
  assert.equal(formatRange("15:00", "19:30"), "3–7:30 PM");
  assert.equal(formatRange("11:00", "14:00"), "11 AM–2 PM");
  assert.equal(formatRange("17:00", "24:00"), "5 PM–midnight");
});

test("describeStatus gives the exact words for the pill and the line beside it", () => {
  assert.deepEqual(describeStatus({ state: "open", closes: "19:00" }), { label: "Open", detail: "until 7 PM" });
  assert.deepEqual(describeStatus({ state: "soon", closes: "19:00" }), { label: "Closing soon", detail: "closes 7 PM" });
  assert.deepEqual(
    describeStatus({ state: "closed", opensNext: { isoDate: "2026-11-19", dayKey: "thu", opens: "16:00", isToday: false } }),
    { label: "Closed", detail: "opens Thu 4 PM" },
  );
  assert.deepEqual(
    describeStatus({ state: "closed", opensNext: { isoDate: "2026-11-15", dayKey: "sun", opens: "15:00", isToday: true } }),
    { label: "Closed", detail: "opens 3 PM" },
  );
  assert.deepEqual(
    describeStatus({ state: "private", opensNext: { isoDate: "2026-11-15", dayKey: "sun", opens: "15:00", isToday: false } }),
    { label: "Private event", detail: "opens Sun 3 PM" },
  );
  assert.deepEqual(describeStatus({ state: "closed", opensNext: null }), { label: "Closed", detail: "" });
});

test("hoursText says one day's hours the way the hours table shows them", () => {
  assert.equal(hoursText({ kind: "open", opens: "16:00", closes: "20:00" }), "4–8 PM");
  assert.equal(hoursText({ kind: "private" }), "Private events");
  assert.equal(hoursText({ kind: "closed" }), "Closed");
});

test("summarizeWeek groups neighbouring days that keep the same hours", () => {
  assert.deepEqual(
    summarizeWeek(schedule.weekly).map((group) => [group.days, group.text, group.kind]),
    [
      ["Mon–Wed", "Closed", "closed"],
      ["Thu, Fri", "4–8 PM", "open"],
      ["Sat", "Private events", "private"],
      ["Sun", "3–7 PM", "open"],
    ],
  );
});

test("summarizeWeek keeps days apart when the hours differ by a minute, and never joins Sunday back to Monday", () => {
  const week = { ...schedule.weekly, mon: { kind: "open", opens: "15:00", closes: "19:00" }, fri: { kind: "open", opens: "16:00", closes: "20:30" } } as const;
  assert.deepEqual(
    summarizeWeek(week).map((group) => group.days),
    ["Mon", "Tue, Wed", "Thu", "Fri", "Sat", "Sun"],
  );
});
