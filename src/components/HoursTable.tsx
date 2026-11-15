"use client";

// The week, Monday to Sunday, with today's row filled in. A dated exception (a holiday,
// a buyout) replaces today's hours and is listed underneath until it has passed.
import { useEffect, useState } from "react";
import { schedule } from "@/content/hours";
import { dayLabel, dayOrder, hoursOn, hoursText, localMoment, type DayKey } from "@/lib/status";

type Today = { isoDate: string; dayKey: DayKey };

const dateLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
    new Date(`${isoDate}T12:00:00Z`),
  );

export function HoursTable() {
  const [today, setToday] = useState<Today | null>(null);
  useEffect(() => {
    const { isoDate, dayKey } = localMoment(new Date(), schedule.timeZone);
    setToday({ isoDate, dayKey });
  }, []);

  const todayException = today ? schedule.exceptions.find((exception) => exception.date === today.isoDate) : undefined;
  const upcoming = today ? schedule.exceptions.filter((exception) => exception.date > today.isoDate).slice(0, 3) : [];

  return (
    <dl className={`cm-hours${todayException ? " cm-hours--changed" : ""}`} aria-label="Taproom hours">
      {dayOrder.map((day) => {
        const isToday = today?.dayKey === day;
        const hours = isToday && today ? hoursOn(today.isoDate, day, schedule) : schedule.weekly[day];
        const rowClass = isToday ? " cm-hours__row--today" : hours.kind === "closed" ? " cm-hours__row--closed" : "";
        return (
          <div className={`cm-hours__row${rowClass}`} key={day}>
            <dt className={`cm-hours__day ${isToday ? "cm-body-strong" : "cm-body"}`}>{isToday ? "Today" : dayLabel[day]}</dt>
            <dd className="cm-hours__time cm-data">{hoursText(hours)}</dd>
            {isToday && todayException ? <dd className="cm-hours__sub cm-small">{todayException.reason}</dd> : null}
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
