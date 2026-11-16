"use client";

import { useState, type FormEvent } from "react";
import type { WeekDay } from "@/content/portal-demo";
import { dayHoursText, removeEvent, resetWeek, saveEvent, setWeekDay, upcomingEvents, weekDates, weekFor, weekStartOf, type EventInput } from "@/lib/taproom-week";
import { formatRange } from "@/lib/status";
import { Confirm } from "@/components/Confirm";
import { dayDate, newId, shortDate, type PanelProps } from "../format";

const shiftWeek = (weekStart: string, weeks: number) => {
  const date = new Date(weekStart + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + weeks * 7);
  return date.toISOString().slice(0, 10);
};
const blank = (date: string): EventInput => ({ title: "", date, start: "16:00", end: "20:00", note: "", listed: true });

/** This week's taproom hours and the special events list. */
export function WeekPanel({ state, commit, run, today }: PanelProps) {
  const thisWeek = weekStartOf(today);
  const [week, setWeek] = useState(thisWeek);
  const [draft, setDraft] = useState<EventInput>(() => blank(today));
  const [editing, setEditing] = useState<string | null>(null);
  const { days, changed } = weekFor(state, week);
  const dates = weekDates(week);
  const events = upcomingEvents(state, today);
  const change = (index: number, patch: Partial<WeekDay>) =>
    run("Changed hours for " + dayDate(dates[index]), s => setWeekDay(s, week, index, patch));
  function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (run((editing ? "Updated event: " : "Added event: ") + draft.title.trim(), s => saveEvent(s, draft, editing ?? newId("EV")))) {
      setDraft(blank(today)); setEditing(null);
    }
  }

  return <>
    <section className="cm-portal__panel" data-tour="week">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Taproom hours</p>
        <h2>Week of {shortDate(week)}{week === thisWeek ? " (this week)" : ""}</h2></div>
        <div className="cm-portal__order-actions">
          <button type="button" className="cm-portal__button" onClick={() => setWeek(shiftWeek(week, -1))} aria-label="Previous week">←</button>
          <button type="button" className="cm-portal__button" onClick={() => setWeek(thisWeek)}>This week</button>
          <button type="button" className="cm-portal__button" onClick={() => setWeek(shiftWeek(week, 1))} aria-label="Next week">→</button>
        </div></div>
      <p className="cm-portal__muted">Change any day for this one week. Other weeks keep the usual hours. <Confirm id="hours"/></p>
      <div className="cm-portal__week">{days.map((day, index) => <div className="cm-portal__week-day" key={dates[index]}>
        <div className="cm-portal__week-name"><strong>{dayDate(dates[index])}</strong><span>{dayHoursText(day)}</span></div>
        <label>Status<select value={day.kind} onChange={e => change(index, { kind: e.target.value as WeekDay["kind"] })}>
          <option value="open">Open</option><option value="closed">Closed</option><option value="private">Private events</option></select></label>
        <label>Opens<input type="time" value={day.opens} disabled={day.kind !== "open"} onChange={e => change(index, { opens: e.target.value })}/></label>
        <label>Closes<input type="time" value={day.closes} disabled={day.kind !== "open"} onChange={e => change(index, { closes: e.target.value })}/></label>
        <label className="cm-portal__week-note">Note for the day<input type="text" maxLength={120} value={day.note}
          placeholder="Holiday, early close, band…" onChange={e => change(index, { note: e.target.value })}/></label>
      </div>)}</div>
      <div className="cm-portal__order-actions">
        <button type="button" className="cm-portal__button" disabled={!changed}
          onClick={() => commit("Reset the week of " + shortDate(week) + " to the usual hours", s => resetWeek(s, week))}>Back to the usual hours</button>
        <span className="cm-portal__muted">{changed ? "This week differs from the usual hours." : "This week is on the usual hours."}</span>
      </div>
      <p className="cm-portal__muted">Saved in this browser only. The public site keeps reading its own hours file until the live backend connects the two.</p>
    </section>
    <div className="cm-portal__two">
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>{editing ? "Edit event" : "Add a special event"}</h2></div>
        <form className="cm-portal__form" onSubmit={submitEvent}>
          <label>Event name<input type="text" required maxLength={80} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label>
          <label>Date<input type="date" required value={draft.date} onChange={e => setDraft({ ...draft, date: e.target.value })}/></label>
          <div className="cm-portal__pair">
            <label>Starts<input type="time" required value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })}/></label>
            <label>Ends<input type="time" required value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })}/></label>
          </div>
          <label>Details<textarea rows={2} maxLength={240} value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })}/></label>
          <label className="cm-portal__check"><input type="checkbox" checked={draft.listed} onChange={e => setDraft({ ...draft, listed: e.target.checked })}/> List it on the public site</label>
          <div className="cm-portal__order-actions">
            <button type="submit" className="cm-portal__button cm-portal__button--dark">{editing ? "Save event" : "Add event"}</button>
            {editing && <button type="button" className="cm-portal__button" onClick={() => { setEditing(null); setDraft(blank(today)); }}>Stop editing</button>}
          </div>
        </form>
      </section>
      <section className="cm-portal__panel">
        <div className="cm-portal__panel-head"><h2>Special events</h2><span>{events.length} upcoming</span></div>
        {events.length === 0 && <p className="cm-portal__muted">No events listed.</p>}
        <ul className="cm-portal__agenda">{events.map(event => <li className="cm-portal__agenda-item" key={event.id}>
          <p className="cm-portal__overline">{dayDate(event.date)} · {formatRange(event.start, event.end)} · {event.listed ? "listed" : "staff only"}</p>
          <strong>{event.title}</strong>{event.note && <span>{event.note}</span>}
          <div className="cm-portal__order-actions">
            <button type="button" className="cm-portal__button" onClick={() => { const { id: _id, ...rest } = event; setDraft(rest); setEditing(event.id); }}>Edit</button>
            <button type="button" className="cm-portal__button" onClick={() => commit("Removed event: " + event.title, s => removeEvent(s, event.id))}>Remove</button>
          </div>
        </li>)}</ul>
      </section>
    </div>
  </>;
}
