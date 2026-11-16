import { Confirm } from "@/components/Confirm";
import { FlavorCard } from "@/components/FlavorCard";
import { Photo } from "@/components/Photo";
import { allSeltzers, seltzerLine, seltzerProcess, seltzersPouring, tapList } from "@/content/drinks";
import { photos } from "@/content/photos";
import { routes } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Colony Cabana hard seltzer archive",
  description: "Explore Colony Mash's hard seltzer release archive in Atascadero. Current pours are verified separately.",
  path: routes.seltzer,
});

export default function SeltzerPage() {
  const current = tapList.confirmed ? seltzersPouring : [];
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
              {allSeltzers.length} cataloged seltzer releases. Current pouring status is published only after brewery verification.
            </p>
            <p className="cm-inline cm-body">
              {seltzerProcess}
              <Confirm id="process" />
            </p>
          </div>
          <Photo slot={photos.flight} eager />
        </div>
      </section>

      {tapList.confirmed && current.length > 0 && <section data-theme="ink" className="cm-section cm-root" aria-labelledby="seltzer-on">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-sign-lg" id="seltzer-on">
              Currently pouring
            </h2>
            <span className="cm-inline">
              <span className="cm-data">{current.length}</span>
              <Confirm id="taps" />
            </span>
          </div>
          <ul className="cm-cards">
            {current.map((seltzer) => (
              <li key={seltzer.slug}>
                <FlavorCard seltzer={seltzer} />
              </li>
            ))}
          </ul>
        </div>
      </section>}

      <section data-theme="paper" className="cm-section cm-root" aria-labelledby="seltzer-off">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-sign-lg" id="seltzer-off">
              Seltzer release archive
            </h2>
            <span className="cm-data">{allSeltzers.length}</span>
          </div>
          <p className="cm-body">The archive includes historical flavors, not a verified tap list or packaged stock. See the current rotation for brewery-confirmed pours.</p>
          <ul className="cm-cards">
            {allSeltzers.map((seltzer) => (
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
