import { Confirm } from "@/components/Confirm";
import { FlavorCard } from "@/components/FlavorCard";
import { Photo } from "@/components/Photo";
import { allSeltzers, isPouring, seltzerLine, seltzerProcess, seltzersPouring } from "@/content/drinks";
import { photos } from "@/content/photos";
import { routes } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Hard seltzer",
  description: "Hard seltzer made at Colony Mash in Atascadero. Every flavor, its ABV, and which ones are on tap this week.",
  path: routes.seltzer,
});

export default function SeltzerPage() {
  const notPouring = allSeltzers.filter((seltzer) => !isPouring(seltzer));
  return (
    <>
      <section data-theme="paper" className="cm-section cm-root">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-pagehead">
            <p className="cm-inline">
              <span className="cm-label">{seltzerLine}</span>
              <Confirm id="seltzer-line" />
            </p>
            <h1 className="cm-shout-xl">Seltzer, in color</h1>
            <p className="cm-lede cm-measure">
              {allSeltzers.length} flavors so far. {seltzersPouring.length} on tap this week.
            </p>
            <p className="cm-inline cm-body">
              {seltzerProcess}
              <Confirm id="process" />
            </p>
          </div>
          <Photo slot={photos.flight} eager />
        </div>
      </section>

      <section data-theme="ink" className="cm-section cm-root" aria-labelledby="seltzer-on">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-sign-lg" id="seltzer-on">
              On tap
            </h2>
            <span className="cm-inline">
              <span className="cm-data">{seltzersPouring.length}</span>
              <Confirm id="taps" />
            </span>
          </div>
          <ul className="cm-cards">
            {seltzersPouring.map((seltzer) => (
              <li key={seltzer.slug}>
                <FlavorCard seltzer={seltzer} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section data-theme="paper" className="cm-section cm-root" aria-labelledby="seltzer-off">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-sign-lg" id="seltzer-off">
              Not pouring right now
            </h2>
            <span className="cm-data">{notPouring.length}</span>
          </div>
          <ul className="cm-cards">
            {notPouring.map((seltzer) => (
              <li key={seltzer.slug}>
                <FlavorCard seltzer={seltzer} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
