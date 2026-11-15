import Link from "next/link";
import { BookingCard } from "@/components/BookingCard";
import { Confirm } from "@/components/Confirm";
import { Flight } from "@/components/FlightStrip";
import { HoursTable } from "@/components/HoursTable";
import { StatusPill } from "@/components/LiveStatus";
import { LocationCard } from "@/components/LocationCard";
import { Photo } from "@/components/Photo";
import { TapRow } from "@/components/TapRow";
import { allSeltzers, beersOnTap, drinksOnTap, seltzersPouring } from "@/content/drinks";
import { schedule } from "@/content/hours";
import { photos } from "@/content/photos";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import { summarizeWeek } from "@/lib/status";

export const metadata = pageMeta({
  title: `${site.fullName} | Brewery and seltzery in Atascadero, CA`,
  description: site.description,
  path: routes.home,
  absoluteTitle: true,
});

export default function HomePage() {
  const openDays = summarizeWeek(schedule.weekly)
    .filter((group) => group.kind === "open")
    .map((group) => `${group.days} ${group.text}`)
    .join(" · ");

  return (
    <>
      <section data-theme="ink" className="cm-section cm-root">
        <div className="cm-wrap cm-hero">
          <div className="cm-stack cm-stack--lg">
            <StatusPill fallback={openDays} />
            <h1 className="cm-sign-xl">A brewery and a seltzery in Atascadero</h1>
            <p className="cm-lede cm-measure">
              Twelve taps of beer and hard seltzer at {site.address.street}, next to Joebella Coffee.
            </p>
            <div className="cm-actions">
              <a className="cm-btn cm-btn--primary cm-body-strong" href={site.directionsUrl}>
                Get directions
              </a>
              <Link className="cm-btn cm-body-strong" href={routes.onTap}>
                See what&apos;s on tap
              </Link>
            </div>
          </div>
          <span className="cm-logo cm-logo--hero cm-hero__mark" aria-hidden="true" />
        </div>
      </section>

      <section data-theme="paper" className="cm-section cm-root" aria-labelledby="home-seltzer">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-shout-xl" id="home-seltzer">
              Seltzer, in color
            </h2>
            <span className="cm-inline">
              <span className="cm-data">
                {allSeltzers.length} flavors · {seltzersPouring.length} on tap
              </span>
              <Confirm id="taps" />
            </span>
          </div>
          <Photo slot={photos.flight} eager />
          <Flight />
          <p className="cm-inline cm-small">
            <span className="cm-mini">
              <span className="cm-dot cm-dot--full" aria-hidden="true" />
              On tap now
            </span>
            <span className="cm-mini">
              <span className="cm-dot" aria-hidden="true" />
              Not pouring right now
            </span>
          </p>
          <div className="cm-actions">
            <Link className="cm-btn cm-body-strong" href={routes.seltzer}>
              All {allSeltzers.length} flavors
            </Link>
          </div>
        </div>
      </section>

      <section data-theme="ink" className="cm-section cm-root" aria-labelledby="home-beer">
        <div className="cm-wrap cm-split">
          <div className="cm-taps">
            <div className="cm-taps__head">
              <h2 className="cm-sign-lg" id="home-beer">
                Beer, in black and white
              </h2>
              <span className="cm-data">{beersOnTap.length} on tap</span>
            </div>
            <ul className="cm-taps__list">
              {beersOnTap.map((beer) => (
                <TapRow drink={beer} key={beer.slug} />
              ))}
            </ul>
            <Link className="cm-btn cm-body-strong" href={routes.onTap}>
              All {drinksOnTap.length} taps
            </Link>
          </div>
          <Photo slot={photos.pilsnerCans} caption="Postconventional Pilsner, the first beer in the tanks." />
        </div>
      </section>

      <section data-theme="paper" className="cm-section cm-root" aria-labelledby="home-visit">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-split">
            <div className="cm-stack cm-stack--fill">
              <div className="cm-section__head">
                <h2 className="cm-sign-lg" id="home-visit">
                  This week
                </h2>
                <Confirm id="hours" />
              </div>
              <HoursTable />
            </div>
            <div className="cm-stack cm-stack--fill">
              <LocationCard />
              <Link className="cm-link cm-body-strong" href={routes.visit}>
                Seating, access and house rules
              </Link>
            </div>
          </div>
          <Photo slot={photos.building} />
        </div>
      </section>

      <section data-theme="ink" className="cm-section cm-root">
        <div className="cm-wrap cm-split">
          <BookingCard />
          <Photo slot={photos.privateRoom} />
        </div>
      </section>
    </>
  );
}
