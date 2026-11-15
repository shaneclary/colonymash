
import { CatalogExplorer } from "@/components/CatalogExplorer";
import { drinks } from "@/content/drinks";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Explore the releases", description: "Explore the Colony Mash beer and hard seltzer library.", path: "/explore" });
export default function ExplorePage() {
  return <>
    <section data-theme="ink" className="cm-section cm-root"><div className="cm-wrap cm-stack cm-stack--lg">
      <p className="cm-label">THE COLONY MASH LIBRARY</p><h1 className="cm-sign-xl">Every pour has a story.</h1>
      <p className="cm-lede cm-measure">Beer in black and white. Seltzer in living color.</p>
    </div></section>
    <section data-theme="paper" className="cm-section cm-root"><div className="cm-wrap"><CatalogExplorer drinks={drinks} /></div></section>
  </>;
}
