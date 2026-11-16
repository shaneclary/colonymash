import Link from "next/link";
import { Confirm } from "@/components/Confirm";
import { OnTapElsewhere } from "@/components/OnTapElsewhere";
import { RotationFocus } from "@/components/RotationFocus";
import { tapList } from "@/content/drinks";
import { routes } from "@/content/site";
import { pageMeta } from "@/lib/seo";
import "../rotation.css";

export const metadata = pageMeta({
  title: "Current tap rotation",
  description: "Check Colony Mash's verified beer and hard seltzer tap rotation in Atascadero. Historical releases are archived separately.",
  path: routes.onTap,
});
export default function OnTapPage() {
  return <>
    <section data-theme="paper" className="cm-section cm-root">
      <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
        <p className="cm-label">COLONY MASH / THE ROTATION</p>
        <div className="cm-section__head">
          <h1 className="cm-sign-xl">What's pouring</h1>
          <Confirm id="taps"/>
        </div>
        <p className="cm-lede cm-measure">A simple, honest look at the beer and seltzers in rotation. We only display a current tap list when the brewery has verified it.</p>
        <RotationFocus/>
        {!tapList.confirmed && <p className="cm-small">The older sample tap selection has been hidden from this page until Erik confirms the current list.</p>}
        <div className="cm-actions">
          <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.order}>Ask about cans &amp; kegs</Link>
          <Link className="cm-btn cm-body-strong" href={routes.explore}>Explore past releases</Link>
        </div>
      </div>
    </section>
    <OnTapElsewhere/>
  </>;
}
