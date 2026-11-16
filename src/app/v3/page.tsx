import Link from "next/link";
import { RotationFocus } from "@/components/RotationFocus";
import { tapList } from "@/content/drinks";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import "../v3.css";
import "../rotation.css";
import "../v3-practical.css";

export const metadata = pageMeta({
  title: "V3 Practical Launch Preview | Colony Mash",
  description: "A practical, mobile-first preview focused on Colony Mash's verified current rotation, cans and kegs, and the Atascadero taproom community.",
  path: "/v3",
  index: false,
});

const colors = ["red","pink","coral","orange","mango","yellow","lime","green","aqua","blue","purple","berry"];

export default function PracticalV3Page() {
  return <div className="v3 cm-root" data-theme="paper">
    <section className="v3-hero" data-theme="ink" aria-labelledby="v3-title">
      <div className="v3-inner v3-hero__grid">
        <div className="v3-hero__copy">
          <p className="v3-kicker"><span className="v3-kicker__square" /> COLONY MASH / THE PRACTICAL NEXT CHAPTER</p>
          <h1 id="v3-title" className="v3-hero__title"><span>FIND YOUR</span><em>COLOR.</em></h1>
          <p className="v3-hero__lede">Current flavors. Good people. Beer in black and white, hard seltzer in living color. Everything starts with what's pouring at the brewery.</p>
          <div className="v3-hero__actions">
            <a href="#current-rotation" className="v3-button v3-button--light">See the current rotation ↗</a>
            <Link href={routes.order} className="v3-button v3-button--outline-light">Cans &amp; kegs to go</Link>
          </div>
          <p className="v3-hero__foot">LAUNCH EXPERIENCE PREVIEW · VERIFIED ROTATION REQUIRED</p>
        </div>
        <div className="v3-hero__art" aria-label="The Colony Mash color spectrum, used for brand identity">
          <div className="v3-spectrum" aria-hidden="true">{colors.map((tone,i)=>
            <span key={tone} className={"v3-spectrum__bar v3-spectrum__bar--"+i+" cm-fill--"+tone}/>)}</div>
          <div className="v3-hero__roundel" aria-hidden="true">
            <span>ATASCADERO</span><strong>BEER &amp;<br/>CABANA</strong><span>THE GOOD STUFF IS HERE</span>
          </div>
          <p className="v3-hero__art-caption">BRAND COLOR PALETTE — NOT A CLAIM ABOUT TODAY'S TAPS</p>
        </div>
      </div>
    </section>
    <nav className="v3-subnav" aria-label="Explore this preview">
      <div className="v3-inner v3-subnav__inner">
        <a href="#current-rotation">01 / WHAT'S POURING</a>
        <a href="#go">02 / CANS &amp; KEGS</a>
        <a href="#the-colony">03 / THE COLONY</a>
        <a href="#come-by">04 / VISIT</a>
      </div>
    </nav>
    <section id="current-rotation" className="v3-section v3-practical-rotation" aria-labelledby="practical-rotation-title">
      <div className="v3-inner">
        <div className="v3-sectionhead">
          <p className="v3-sectionnum">01 / TODAY'S FOCUS</p>
          <h2 id="practical-rotation-title" className="v3-display">WHAT'S<br/><span>POURING.</span></h2>
          <p>Small-batch releases change. This section will spotlight only the beer and seltzers the brewery has actually confirmed in rotation.</p>
        </div>
        <RotationFocus/>
        <div className="v3-practical-actions">
          <Link className="v3-button v3-button--dark" href={routes.onTap}>Tapboard details ↗</Link>
          <Link className="v3-button v3-button--ghost" href={routes.explore}>Past flavor archive ↗</Link>
        </div>
      </div>
    </section>
    <section id="go" className="v3-section v3-concierge" data-theme="ink" aria-labelledby="practical-go-title">
      <div className="v3-inner v3-concierge__grid">
        <div>
          <p className="v3-sectionnum">02 / TAKE COLONY HOME</p>
          <h2 id="practical-go-title" className="v3-display">CANS.<br/>6-PACKS.<br/><span>KEGS.</span></h2>
          <p>Choose a package format, tap + next to the flavors you're interested in, and build one easy pickup inquiry. We'll confirm availability and pricing.</p>
          <Link href={routes.order} className="v3-button v3-button--light">Build your request ↗</Link>
        </div>
        <div className="v3-concierge__terms">
          <p>SIMPLE TO REQUEST / REAL OPTIONS TO CONFIRM</p>
          <div><strong>01</strong><span>SINGLE CANS / PACKAGE SIZE TO CONFIRM</span></div>
          <div><strong>06</strong><span>6-PACKS / RELEASE AVAILABILITY TO CONFIRM</span></div>
          <div><strong>KEG</strong><span>KEG SIZES, DEPOSITS AND DELIVERY TERMS TO CONFIRM</span></div>
          <p className="v3-concierge__fine">Pickup is an availability inquiry, not a paid purchase. County and regional delivery proposals require Erik's approval.</p>
        </div>
      </div>
    </section>
    <section id="the-colony" className="v3-section v3-practical-colony" aria-labelledby="practical-community-title">
      <div className="v3-inner v3-practical-colony__grid">
        <div className="v3-practical-colony__specimen" aria-hidden="true">
          <span className="v3-practical-colony__stamp">COLONY CABANA / TROPICAL FIELD NOTES</span>
          <svg viewBox="0 0 200 250" width="100%" height="240" aria-hidden="true">
            <path d="M82 236C99 180 87 111 145 15M99 172C44 173 35 136 34 90C83 107 99 138 99 172ZM109 118C139 121 168 85 181 48C146 55 116 78 109 118ZM89 205C57 199 28 176 25 147C64 151 88 173 89 205Z" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="140" cy="205" r="23" fill="none" stroke="currentColor" strokeWidth="2"/>
            <path d="M140 182V228M117 205H163M123 188L157 222M157 188L123 222" fill="none" stroke="currentColor"/>
          </svg>
          <strong>GOOD COMPANY<br/>IS A CULTURE.</strong>
          <span className="v3-practical-colony__stamp">ATASCADERO, CALIFORNIA / EST. HERE</span>
        </div>
        <div className="v3-practical-colony__copy">
          <p className="v3-sectionnum">03 / THE PEOPLE ARE THE POINT</p>
          <h2 id="practical-community-title" className="v3-display">THE<br/><span>COLONY.</span></h2>
          <p>Start with real connections: the taproom, local events, a conversation at the bar, and the releases people come back for. Community-created flavor development can wait until Erik wants to explore it.</p>
          <div className="v3-practical-actions">
            <Link href={routes.community} className="v3-button v3-button--dark">Discover the Colony ↗</Link>
            <a href={site.instagram.url} className="v3-button v3-button--ghost">Brewery updates ↗</a>
          </div>
          <p className="v3-disclaimer">This botanical, tropical field-station identity is a visual theme—not a flavor-submission or recipe contest.</p>
        </div>
      </div>
    </section>
    <section id="come-by" className="v3-section v3-drops" aria-labelledby="practical-visit-title">
      <div className="v3-inner v3-drops__grid">
        <div className="v3-drops__graphic" aria-hidden="true">
          <div className="v3-drops__stripe cm-fill--red"/><div className="v3-drops__stripe cm-fill--mango"/>
          <div className="v3-drops__stripe cm-fill--lime"/><div className="v3-drops__stripe cm-fill--blue"/>
          <span>COME<br/>BY.</span>
        </div>
        <div className="v3-drops__copy">
          <p className="v3-sectionnum">04 / THE ACTUAL PLACE</p>
          <h2 id="practical-visit-title" className="v3-display">SEE YOU<br/><span>HERE.</span></h2>
          <p>{site.address.street}, {site.address.city}, California. Check verified taproom hours and make a visit part of your week. Hours are awaiting Erik's confirmation.</p>
          <Link href={routes.visit} className="v3-button v3-button--dark">Plan your visit ↗</Link>
          <a href={site.directionsUrl} className="v3-button v3-button--ghost">Directions ↗</a>
        </div>
      </div>
    </section>
    <section className="v3-outro">
      <div className="v3-inner v3-outro__inner">
        <span>COLONY MASH / THE PRACTICAL LAUNCH EXPERIENCE</span>
        <strong>REAL FLAVORS.<br/>REAL PEOPLE.</strong>
        <p>{tapList.confirmed ? "Explore the confirmed rotation and plan a visit." : "Tap list and packaging details require brewery confirmation before launch."}</p>
        <div><Link href={routes.home}>Return to homepage ↗</Link><Link href={routes.community}>Meet the Colony ↗</Link></div>
      </div>
    </section>
  </div>;
}
