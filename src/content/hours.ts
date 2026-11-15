// Taproom hours. The StatusPill, the hours table, the footer and structured data all read this file.
// Change the hours here and nowhere else, then update the Google listing and the Instagram bio to match.
import type { DayHours, DayKey, HoursException, Schedule } from "../lib/status.ts";

// From the Instagram bio and Yelp, which agreed in November 2026. The handwritten sign on the door,
// in an undated photo, reads the same way. Other public listings showed at least four other sets.
// Not yet confirmed by the owners: see the "hours" question.
export const weeklyHours: Record<DayKey, DayHours> = {
  mon: { kind: "closed" },
  tue: { kind: "closed" },
  wed: { kind: "closed" },
  thu: { kind: "open", opens: "16:00", closes: "20:00" },
  fri: { kind: "open", opens: "16:00", closes: "20:00" },
  sat: { kind: "private" },
  sun: { kind: "open", opens: "15:00", closes: "19:00" },
};

// Holidays, buyouts on an open night, special openings. Dates are "YYYY-MM-DD" in Pacific time.
// Example: { date: "2026-11-26", hours: { kind: "closed" }, reason: "Thanksgiving" }
export const hoursExceptions: HoursException[] = [];

export const schedule: Schedule = {
  timeZone: "America/Los_Angeles",
  weekly: weeklyHours,
  exceptions: hoursExceptions,
  closingSoonMinutes: 60,
};

export const timeZoneLabel = "Pacific time";
