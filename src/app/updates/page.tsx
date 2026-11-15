import { UpdatesPreview } from "@/components/UpdatesPreview";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Mash updates", description: "Preview Colony Mash release alerts and taproom updates.", path: "/updates" });
export default function UpdatesPage() {
  return <>
    <section data-theme="ink" className="cm-section cm-root"><div className="cm-wrap cm-stack cm-stack--lg">
      <p className="cm-label">STAY CLOSE TO THE TAP</p><h1 className="cm-sign-xl">Know when it pours.</h1>
      <p className="cm-lede cm-measure">New flavor. Returning favorite. Fresh keg. Just the updates worth getting.</p>
    </div></section>
    <section data-theme="paper" className="cm-section cm-root"><div className="cm-wrap"><UpdatesPreview /></div></section>
  </>;
}
