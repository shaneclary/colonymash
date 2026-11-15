import { Confirm } from "@/components/Confirm";
import { OnTapElsewhere } from "@/components/OnTapElsewhere";
import { TapList } from "@/components/TapList";
import { TapRow } from "@/components/TapRow";
import { drinks, tapList } from "@/content/drinks";
import { routes } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "On tap",
  description: "What is pouring at Colony Mash in Atascadero: beer and hard seltzer, with style and ABV for each.",
  path: routes.onTap,
});

export default function OnTapPage() {
  const offTheList = drinks.filter((drink) => !drink.onTap);
  return (
    <>
      <section data-theme="paper" className="cm-section cm-root">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-pagehead">
            <h1 className="cm-sign-xl">On tap</h1>
            <p className="cm-inline">
              <span className="cm-fresh cm-data">{tapList.updated ?? tapList.sampleNote}</span>
              <Confirm id="taps" />
            </p>
          </div>
          <TapList />
        </div>
      </section>

      <section data-theme="ink" className="cm-section cm-root" aria-labelledby="off-the-list">
        <div className="cm-wrap">
          <div className="cm-taps">
            <div className="cm-taps__head">
              <h2 className="cm-sign-lg" id="off-the-list">
                Not pouring right now
              </h2>
              <span className="cm-data">
                {offTheList.length} of {drinks.length}
              </span>
            </div>
            <ul className="cm-taps__list">
              {offTheList.map((drink) => (
                <TapRow drink={drink} key={drink.slug} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      <OnTapElsewhere />
    </>
  );
}
