
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { drinks } from "@/content/drinks";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Past release archive", description: "Explore historical Colony Mash beers and hard seltzer releases. This is not a verified live tap list or packaged inventory.", path: "/explore" });
export default function ExplorePage() {
  return <>
    <section data-theme="ink" className="cm-section cm-root"><div className="cm-wrap cm-stack cm-stack--lg">
      <p className="cm-label">PAST RELEASES / THE COLONY MASH LIBRARY</p><h1 className="cm-sign-xl">The flavor archive.</h1>
      <p className="cm-lede cm-measure">Past and present cataloged beers and seltzers. For current pours, visit the verified tap rotation.</p>
    </div></section>
    <section data-theme="paper" className="cm-section cm-root"><div className="cm-wrap"><CatalogExplorer drinks={drinks} /></div></section>
  </>;
}
