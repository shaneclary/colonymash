
import { PickupPlanner } from "@/components/PickupPlanner";
import "../order-flow.css";
import { Confirm } from "@/components/Confirm";
import { drinks, findDrink } from "@/content/drinks";
import { site } from "@/content/site";
import { pageMeta } from "@/lib/seo";
export const metadata = pageMeta({ title: "Cans & kegs", description: "Build a Colony Mash pickup availability request for cans or kegs.", path: "/order" });
export default async function OrderPage({ searchParams }: { searchParams: Promise<{ drink?: string }> }) {
  const params = await searchParams;
  const initial = typeof params.drink === "string" && findDrink(params.drink) ? params.drink : "";
  return <>
    <section data-theme="ink" className="cm-section cm-root"><div className="cm-wrap cm-stack cm-stack--lg">
      <p className="cm-label">CANS & KEGS</p><h1 className="cm-sign-xl">Take Colony Mash home.</h1>
      <p className="cm-lede cm-measure">Pick a format, tap + beside each flavor, then review your request. No repeated dropdowns.</p>
    </div></section>
    <section data-theme="paper" className="cm-section cm-root"><div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
      <div className="cm-section__head"><h2 className="cm-sign-lg">Choose. Tap. Done.</h2>
        <span className="cm-inline"><span className="cm-tag cm-tag--dashed cm-label">Preview — no payment</span><Confirm id="pickup-products" /></span></div>
      <PickupPlanner drinks={drinks} initialSlug={initial} contactEmail={site.email} />
    </div></section>
  </>;
}
