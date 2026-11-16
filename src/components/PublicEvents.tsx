"use client";

import { formatRange } from "@/lib/status";
import { usePublicSite } from "./usePublicSite";

const dateLabel = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T12:00:00Z`));

/** Events staff have listed. Shows nothing at all when there are none. */
export function PublicEvents({ heading = "Coming up" }: { heading?: string }) {
  const { events } = usePublicSite();
  if (events.length === 0) return null;
  return (
    <div className="cm-stack">
      <h3 className="cm-label">{heading}</h3>
      <dl className="cm-hours" aria-label={heading}>
        {events.map((event) => (
          <div key={event.id} className="cm-hours__row">
            <dt className="cm-hours__day cm-body">{dateLabel(event.date)}</dt>
            <dd className="cm-hours__time cm-data">{event.title}, {formatRange(event.start, event.end)}</dd>
            {event.note ? <dd className="cm-hours__sub cm-small">{event.note}</dd> : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
