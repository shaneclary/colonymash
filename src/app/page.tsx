import Link from "next/link";
import { BookingCard } from "@/components/BookingCard";
import { Confirm } from "@/components/Confirm";
import { HoursTable } from "@/components/HoursTable";
import { LocationCard } from "@/components/LocationCard";
import { Photo } from "@/components/Photo";
import { RotationFocus } from "@/components/RotationFocus";
import { photos } from "@/content/photos";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import "./rotation.css";

export const metadata = pageMeta({
  title: "Colony Mash Brewing Co. | Beer & Hard Seltzer in Atascadero",
  description: "Explore the verified tap rotation, ask about cans and kegs to go, and find the taproom at Colony Mash in Atascadero, California.",
  path: routes.home,
  absoluteTitle: true,
});

export default function HomePage() {
  return <>
    <section data-theme="ink" className="cm-section cm-root">
      <div className="cm-wrap cm-hero">
        <div className="cm-stack cm-stack--lg">
          <p className="cm-label">ATASCADERO / BEER / HARD SELTZER</p>
          <h1 className="cm-sign-xl">Something different is brewing.</h1>
          <p className="cm-lede cm-measure">Beer in black and white. Hard seltzer in living color. Made for good company at {site.address.street}.</p>
          <div className="cm-actions">
            <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.onTap}>Explore the rotation</Link>
            <Link className="cm-btn cm-body-strong" href={routes.order}>Cans &amp; kegs to go</Link>
            <a className="cm-btn cm-body-strong" href={site.directionsUrl}>Get directions</a>
          </div>
        </div>
        <span className="cm-logo cm-logo--hero cm-hero__mark" aria-hidden="true"/>
      </div>
    </section>

    <section data-theme="paper" className="cm-section cm-root" aria-labelledby="home-rotation">
      <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
        <div className="cm-section__head">
          <div className="cm-stack">
            <p className="cm-label">THE PART THAT MATTERS</p>
            <h2 className="cm-shout-xl" id="home-rotation">Current rotation</h2>
          </div>
          <Confirm id="taps"/>
        </div>
        <RotationFocus compact/>
        <div className="cm-actions">
          <Link className="cm-btn cm-body-strong" href={routes.onTap}>Tap list details</Link>
          <Link className="cm-btn cm-body-strong" href={routes.explore}>Past release archive</Link>
        </div>
      </div>
    </section>

    <section data-theme="ink" className="cm-section cm-root" aria-labelledby="home-to-go">
      <div className="cm-wrap cm-split">
        <div className="cm-stack cm-stack--lg">
          <p className="cm-label">BRING COLONY MASH ALONG</p>
          <h2 className="cm-sign-lg" id="home-to-go">Single cans. 6-packs. Kegs.</h2>
          <p className="cm-lede">Choose a format and build a multi-flavor request. The brewery will confirm what packaged products are available, prices and pickup arrangements.</p>
          <Link className="cm-btn cm-body-strong" href={routes.order}>Build a pickup inquiry</Link>
          <p className="cm-small">Pickup requests are inquiries, not online paid orders. Delivery policies and thresholds await Erik's confirmation.</p>
        </div>
        <Photo slot={photos.pilsnerCans}/>
      </div>
    </section>

    <section data-theme="paper" className="cm-section cm-root" aria-labelledby="home-colony">
      <div className="cm-wrap cm-split">
        <div className="cm-stack cm-stack--lg">
          <p className="cm-label">MORE THAN A TAP LIST</p>
          <h2 className="cm-sign-lg" id="home-colony">Come for the pour. Stay for the people.</h2>
          <p className="cm-lede">Meet your neighbors, see what's happening at the brewery, and follow the releases you love. The Colony starts in the taproom.</p>
          <div className="cm-actions">
            <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.community}>The Colony</Link>
            <a className="cm-btn cm-body-strong" href={site.instagram.url}>Follow the brewery ↗</a>
          </div>
        </div>
        <div className="cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-sign-lg">Plan your visit</h2>
            <Confirm id="hours"/>
          </div>
          <HoursTable/>
          <LocationCard/>
          <Link className="cm-link cm-body-strong" href={routes.visit}>Visit details and accessibility ↗</Link>
        </div>
      </div>
    </section>

    <section data-theme="ink" className="cm-section cm-root">
      <div className="cm-wrap cm-split">
        <BookingCard/>
        <Photo slot={photos.privateRoom}/>
      </div>
    </section>
  </>;
}
