import { AmenityList } from "@/components/AmenityList";
import { Confirm } from "@/components/Confirm";
import { HoursTable } from "@/components/HoursTable";
import { PublicEvents } from "@/components/PublicEvents";
import { StatusPill } from "@/components/LiveStatus";
import { LocationCard } from "@/components/LocationCard";
import { Photo } from "@/components/Photo";
import { schedule, timeZoneLabel } from "@/content/hours";
import { photos } from "@/content/photos";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import { summarizeWeek } from "@/lib/status";

export const metadata = pageMeta({
  title: "Visit",
  description: `Hours, directions and house rules for the Colony Mash taproom at ${site.address.street}, Atascadero, CA.`,
  path: routes.visit,
});

export default function VisitPage() {
  const openDays = summarizeWeek(schedule.weekly)
    .filter((group) => group.kind === "open")
    .map((group) => `${group.days} ${group.text}`)
    .join(" · ");

  return (
    <>
      <section data-theme="ink" className="cm-section cm-root">
        <div className="cm-wrap cm-stack cm-stack--lg">
          <StatusPill fallback={openDays} />
          <h1 className="cm-sign-xl">Visit</h1>
          <p className="cm-lede cm-measure">
            {site.address.street}, {site.address.city}. {site.landmark}.
          </p>
          <div className="cm-actions">
            <a className="cm-btn cm-btn--primary cm-body-strong" href={site.directionsUrl}>
              Get directions
            </a>
            <a className="cm-btn cm-body-strong" href={site.phone.href}>
              Call {site.phone.display}
            </a>
          </div>
        </div>
      </section>

      <section data-theme="paper" className="cm-section cm-root" aria-labelledby="visit-hours">
        <div className="cm-wrap cm-split">
          <div className="cm-stack cm-stack--fill">
            <div className="cm-section__head">
              <h2 className="cm-sign-lg" id="visit-hours">
                This week
              </h2>
              <Confirm id="hours" />
            </div>
            <HoursTable />
            <p className="cm-small cm-soft">All times are {timeZoneLabel}.</p>
            <PublicEvents />
          </div>
          <div className="cm-stack cm-stack--fill">
            <LocationCard />
            <Photo slot={photos.building} />
          </div>
        </div>
      </section>

      <section data-theme="ink" className="cm-section cm-root" aria-labelledby="visit-rules">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <h2 className="cm-sign-lg" id="visit-rules">
            Good to know
          </h2>
          <AmenityList />
        </div>
      </section>

      <section data-theme="paper" className="cm-section cm-root" aria-label="The room">
        <div className="cm-wrap cm-split">
          <Photo slot={photos.bar} />
          <Photo slot={photos.outside} />
        </div>
      </section>
    </>
  );
}
