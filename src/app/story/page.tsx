import { Confirm } from "@/components/Confirm";
import { Photo } from "@/components/Photo";
import { photos } from "@/content/photos";
import { routes } from "@/content/site";
import { story } from "@/content/story";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Our story",
  description: "How Colony Mash got built: two friends, an empty concrete building on El Camino Real, and a taproom that opened in 2020.",
  path: routes.story,
});

export default function StoryPage() {
  return (
    <section data-theme="paper" className="cm-section cm-root">
      <div className="cm-wrap cm-split">
        <div className="cm-stack cm-stack--lg">
          <div className="cm-pagehead">
            <p className="cm-inline">
              <span className="cm-label">Our story</span>
              {story.draft ? <Confirm id="story" /> : null}
            </p>
            <h1 className="cm-sign-xl">{story.title}</h1>
            <p className="cm-lede">{story.lede}</p>
          </div>
          <div className="cm-prose">
            {story.paragraphs.map((paragraph) => (
              <p className="cm-body" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
        <div className="cm-stack cm-stack--lg cm-stack--fill">
          <Photo slot={photos.erik} caption="Erik Knapp, co-owner and brewer." eager />
          <Photo slot={photos.owners} />
          <Photo slot={photos.build} />
        </div>
      </div>
    </section>
  );
}
