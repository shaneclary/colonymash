"use client";

import { useMemo, useState } from "react";
import { calendarEntries, googleCalendarUrl, monthGrid, toIcs, type CalendarEntry } from "@/lib/staff-calendar";
import { formatRange } from "@/lib/status";
import { dayDate, monthTitle, type PanelProps } from "../format";

const kindLabel: Record<CalendarEntry["kind"], string> = {
  order: "Order", batch: "Brew day", event: "Event", request: "Request", "follow-up": "Follow-up", purchase: "Buy",
};
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const stamp = () => new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
export const icsHref = (entries: readonly CalendarEntry[]) =>
  "data:text/calendar;charset=utf-8," + encodeURIComponent(toIcs(entries, stamp()));

/** Add-to-calendar links for one entry. Google opens prefilled. The file opens in Apple Calendar and Outlook. */
export function CalendarLinks({ entry }: { entry: CalendarEntry }) {
  return <span className="cm-portal__cal-links">
    <a href={googleCalendarUrl(entry)} target="_blank" rel="noreferrer">Google Calendar ↗</a>
    <a href={icsHref([entry])} download={entry.id + ".ics"}>Apple / Outlook (.ics)</a>
  </span>;
}

export function AdminCalendar({ state, today }: PanelProps) {
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)));
  const [selected, setSelected] = useState(today);
  const entries = useMemo(() => calendarEntries(state, today), [state, today]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) map.set(entry.date, [...(map.get(entry.date) ?? []), entry]);
    return map;
  }, [entries]);
  const weeks = monthGrid(year, month);
  const prefix = year + "-" + String(month).padStart(2, "0");
  const upcoming = entries.filter(x => x.date >= today);
  const dayEntries = byDay.get(selected) ?? [];
  function move(step: number) {
    const next = new Date(Date.UTC(year, month - 1 + step, 1, 12));
    setYear(next.getUTCFullYear()); setMonth(next.getUTCMonth() + 1);
  }
  function goToday() { setYear(Number(today.slice(0, 4))); setMonth(Number(today.slice(5, 7))); setSelected(today); }

  return <>
    <section className="cm-portal__panel">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Calendar</p><h2>{monthTitle(year, month)}</h2></div>
        <div className="cm-portal__order-actions">
          <button type="button" className="cm-portal__button" onClick={() => move(-1)} aria-label="Previous month">←</button>
          <button type="button" className="cm-portal__button" onClick={goToday}>Today</button>
          <button type="button" className="cm-portal__button" onClick={() => move(1)} aria-label="Next month">→</button>
        </div></div>
      <div className="cm-portal__cal" role="grid" data-tour="calendar" aria-label={monthTitle(year, month)}>
        <div className="cm-portal__cal-row cm-portal__cal-row--head" role="row">
          {weekdays.map(x => <span key={x} role="columnheader">{x}</span>)}</div>
        {weeks.map(week => <div className="cm-portal__cal-row" role="row" key={week[0]}>
          {week.map(day => {
            const items = byDay.get(day) ?? [];
            const classes = ["cm-portal__cal-day", day.startsWith(prefix) ? "" : "cm-portal__cal-day--out",
              day === today ? "cm-portal__cal-day--today" : ""].join(" ");
            return <button type="button" role="gridcell" key={day} className={classes} aria-pressed={day === selected}
              aria-label={dayDate(day) + (items.length ? ", " + items.length + (items.length === 1 ? " item" : " items") : "")}
              onClick={() => setSelected(day)}>
              <b>{Number(day.slice(8))}</b>
              {items.length > 0 && <span className="cm-portal__cal-marks" aria-hidden="true">
                {items.slice(0, 4).map(x => <i key={x.id} className={x.tentative ? "cm-portal__cal-mark--tentative" : ""}/>)}
                {items.length > 4 && <em>+{items.length - 4}</em>}</span>}
              <span className="cm-portal__cal-titles" aria-hidden="true">{items.slice(0, 2).map(x => <span key={x.id}>{x.title}</span>)}</span>
            </button>;
          })}</div>)}
      </div>
      <p className="cm-portal__muted">A solid mark is confirmed. A dashed mark is waiting on an answer. Tap a day to see it.</p>
    </section>
    <div className="cm-portal__two">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>{dayDate(selected)}</h2><span>{dayEntries.length} {dayEntries.length === 1 ? "item" : "items"}</span></div>
        {dayEntries.length === 0 && <p className="cm-portal__muted">Nothing on this day.</p>}
        <ul className="cm-portal__agenda">{dayEntries.map(entry => <AgendaItem key={entry.id} entry={entry}/>)}</ul>
      </section>
      <section className="cm-portal__panel" data-tour="calendar-send">
        <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Google, Apple and Outlook</p><h2>Send to your calendar</h2></div></div>
        <p>Download everything from today on as one calendar file, or add single items from the list.</p>
        <a className="cm-portal__button cm-portal__button--dark" href={icsHref(upcoming)} download="colony-mash-calendar.ics">
          Download {upcoming.length} upcoming items (.ics) ↓</a>
        <p className="cm-portal__muted">Apple Calendar and Outlook open the file directly. In Google Calendar, use Settings, then Import. The file is a copy. It does not update when things change here. A feed that updates itself needs the live backend.</p>
        <div className="cm-portal__panel-head"><h2>Coming up</h2></div>
        <ul className="cm-portal__agenda">{upcoming.slice(0, 8).map(entry => <AgendaItem key={entry.id} entry={entry} showDate/>)}</ul>
      </section>
    </div>
  </>;
}

function AgendaItem({ entry, showDate = false }: { entry: CalendarEntry; showDate?: boolean }) {
  return <li className={entry.tentative ? "cm-portal__agenda-item cm-portal__agenda-item--tentative" : "cm-portal__agenda-item"}>
    <p className="cm-portal__overline">{kindLabel[entry.kind]}{entry.tentative ? " · unconfirmed" : ""}
      {showDate ? " · " + dayDate(entry.date) : ""}{entry.start && entry.end ? " · " + formatRange(entry.start, entry.end) : ""}</p>
    <strong>{entry.title}</strong>
    {entry.detail.trim() && <span>{entry.detail}</span>}
    <CalendarLinks entry={entry}/>
  </li>;
}
