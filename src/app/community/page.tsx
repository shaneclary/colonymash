import Link from "next/link";
import { BookingCard } from "@/components/BookingCard";
import { Photo } from "@/components/Photo";
import { photos } from "@/content/photos";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "The Colony | Taproom & Community",
  description: "Find your people at Colony Mash Brewing Co. in Atascadero. Plan a visit, follow brewery updates and ask about private gatherings.",
  path: routes.community,
});

export default function CommunityPage() {
  return <>
    <section data-theme="ink" className="cm-section cm-root">
      <div className="cm-wrap cm-stack cm-stack--lg">
        <p className="cm-label">THE COLONY / ATASCADERO</p>
        <h1 className="cm-sign-xl">Come for the pour. Stay for the people.</h1>
        <p className="cm-lede cm-measure">There's more to a brewery than a beverage list. The people, conversations, and local connections make this place worth coming back to.</p>
        <div className="cm-actions">
          <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.visit}>Plan a visit</Link>
          <a className="cm-btn cm-body-strong" href={site.instagram.url}>Find us on Instagram ↗</a>
        </div>
      </div>
    </section>
    <section data-theme="paper" className="cm-section cm-root">
      <div className="cm-wrap cm-split">
        <div className="cm-stack cm-stack--lg">
          <p className="cm-label">KEEP IN THE LOOP</p>
          <h2 className="cm-sign-lg">Follow what's happening.</h2>
          <p className="cm-body">The best way to catch brewery announcements right now is through its existing social channel. We're developing opt-in release alerts, but text enrollment isn't active yet.</p>
          <div className="cm-actions">
            <a className="cm-btn cm-btn--primary cm-body-strong" href={site.instagram.url}>Brewery Instagram ↗</a>
            <Link className="cm-btn cm-body-strong" href={routes.updates}>Preview future updates</Link>
          </div>
        </div>
        <div className="cm-stack cm-stack--lg">
          <p className="cm-label">DISCOVER THE ROTATION</p>
          <h2 className="cm-sign-lg">Something different on tap.</h2>
          <p className="cm-body">Follow current verified releases as the rotation changes. The full historical catalog remains available for curious minds.</p>
          <div className="cm-actions">
            <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.onTap}>See the rotation</Link>
            <Link className="cm-btn cm-body-strong" href={routes.explore}>Past releases</Link>
          </div>
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
