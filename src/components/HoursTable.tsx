"use client";

// The week, Monday to Sunday, with today's row filled in. A dated exception (a holiday,
// a buyout) replaces today's hours and is listed underneath until it has passed.
import { useEffect, useState } from "react";
import { dayLabel, dayOrder, hoursOn, hoursText, localMoment, type DayKey } from "@/lib/status";
import { usePublicSite } from "./usePublicSite";

type Today = { isoDate: string; dayKey: DayKey };

const dateLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );

const shiftDate = (isoDate: string, days: number) => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export function HoursTable() {
  // The hours file, with any change staff have made for this week laid over it.
  const { schedule } = usePublicSite();
  const [today, setToday] = useState<Today | null>(null);
  useEffect(() => {
    const { isoDate, dayKey } = localMoment(new Date(), schedule.timeZone);
    setToday({ isoDate, dayKey });
  }, [schedule.timeZone]);

  // The date each row stands for, so a change later this week shows on its own row.
  const monday = today ? shiftDate(today.isoDate, -dayOrder.indexOf(today.dayKey)) : "";
  const dateOf = (day: DayKey) => (monday ? shiftDate(monday, dayOrder.indexOf(day)) : "");
  const exceptionOn = (isoDate: string) => schedule.exceptions.find((exception) => exception.date === isoDate);
  const todayException = today ? exceptionOn(today.isoDate) : undefined;
  const sunday = monday ? shiftDate(monday, 6) : "";
  const upcoming = today ? schedule.exceptions.filter((exception) => exception.date > sunday).slice(0, 3) : [];

  return (
    <dl className={`cm-hours${todayException ? " cm-hours--changed" : ""}`} aria-label="Taproom hours">
      {dayOrder.map((day) => {
        const isToday = today?.dayKey === day;
        const rowDate = dateOf(day);
        const rowException = rowDate ? exceptionOn(rowDate) : undefined;
        const hours = rowDate ? hoursOn(rowDate, day, schedule) : schedule.weekly[day];
        const rowClass = isToday ? " cm-hours__row--today" : hours.kind === "closed" ? " cm-hours__row--closed" : "";
        return (
          <div className={`cm-hours__row${rowClass}`} key={day}>
            <dt className={`cm-hours__day ${isToday ? "cm-body-strong" : "cm-body"}`}>{isToday ? "Today" : dayLabel[day]}</dt>
            <dd className="cm-hours__time cm-data">{hoursText(hours)}</dd>
            {rowException ? <dd className="cm-hours__sub cm-small">{rowException.reason}</dd> : null}
          </div>
        );
      })}
      {upcoming.map((exception) => (
        <div className="cm-hours__row" key={exception.date}>
          <dt className="cm-hours__day cm-body">{dateLabel(exception.date)}</dt>
          <dd className="cm-hours__time cm-data">{hoursText(exception.hours)}</dd>
          <dd className="cm-hours__sub cm-small">{exception.reason}</dd>
        </div>
      ))}
    </dl>
  );
}
