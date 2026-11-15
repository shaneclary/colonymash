import { notFound } from "next/navigation";
import { photoList } from "@/content/photos";
import { questions } from "@/content/questions";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Things to confirm",
  description: "The facts on this draft site that still need a yes from the brewery.",
  path: routes.confirm,
  index: false,
});

/** The owners' checklist. Staging only: this page does not exist once the site is live. */
export default function ConfirmPage() {
  if (!site.reviewMode) notFound();
  const inPlace = photoList.filter((photo) => photo.src);
  const toShoot = photoList.filter((photo) => !photo.src);

  return (
    <>
      <section data-theme="paper" className="cm-section cm-root">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-pagehead">
            <h1 className="cm-sign-xl">Things to confirm</h1>
            <p className="cm-lede cm-measure">
              This draft was built from public listings while the old site was down. Each dashed Confirm tag on the site
              points to one of these {questions.length} questions.
            </p>
          </div>
          <ol className="cm-qlist">
            {questions.map((question) => (
              <li className="cm-q" id={question.id} key={question.id}>
                <h2 className="cm-body-strong">{question.ask}</h2>
                <p className="cm-small">
                  <span className="cm-label">On the site now: </span>
                  {question.assumed}
                </p>
                <p className="cm-small cm-soft">
                  Changes in <code>{question.file}</code>
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section data-theme="ink" className="cm-section cm-root" aria-labelledby="confirm-photos">
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <h2 className="cm-sign-lg" id="confirm-photos">
              Photos
            </h2>
            <span className="cm-data">
              {inPlace.length} in place · {toShoot.length} to shoot
            </span>
          </div>
          <ol className="cm-qlist">
            {inPlace.map((photo) => (
              <li className="cm-q" key={photo.id}>
                <h3 className="cm-body-strong">
                  {photo.id} · {photo.title}
                </h3>
                <p className="cm-small">{photo.credit}</p>
                {photo.note ? <p className="cm-small">{photo.note}</p> : null}
                <p className="cm-small cm-soft">{photo.rightsConfirmed ? "Cleared to use." : "Not yet cleared to use."}</p>
              </li>
            ))}
            {toShoot.map((photo) => (
              <li className="cm-q" key={photo.id}>
                <h3 className="cm-body-strong">
                  {photo.id} · {photo.title}
                </h3>
                <p className="cm-small">{photo.brief}</p>
                <p className="cm-small cm-soft">{photo.treatment === "bw" ? "Shown in black and white." : "Shown in color."}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
