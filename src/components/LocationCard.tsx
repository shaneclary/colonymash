import { schedule } from "@/content/hours";
import { site } from "@/content/site";
import { summarizeWeek } from "@/lib/status";
import { StatusPill } from "./LiveStatus";

/** Where it is and how to get there: status, address, directions, phone. */
export function LocationCard() {
  const openDays = summarizeWeek(schedule.weekly)
    .filter((group) => group.kind === "open")
    .map((group) => `${group.days} ${group.text}`)
    .join(" · ");
  return (
    <article className="cm-loc">
      <div className="cm-loc__head">
        <h2 className="cm-sign-md">Taproom</h2>
        <StatusPill size="md" fallback={openDays} />
      </div>
      <address className="cm-loc__addr cm-body">
        {site.address.street}
        <br />
        {site.address.city}, {site.address.region} {site.address.postalCode}
      </address>
      <p className="cm-small cm-soft">{site.landmark}.</p>
      <div className="cm-loc__actions">
        <a className="cm-btn cm-btn--primary cm-body-strong" href={site.directionsUrl}>
          Get directions
        </a>
        <a className="cm-btn cm-body-strong" href={site.phone.href}>
          Call {site.phone.display}
        </a>
      </div>
    </article>
  );
}
