import Link from "next/link";
import { routes, site } from "@/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "See you at 21",
  description: `This site is for people ${site.legalAge} and older.`,
  path: routes.under21,
  index: false,
});

export default function UnderAgePage() {
  return (
    <section data-theme="ink" className="cm-section cm-root">
      <div className="cm-wrap cm-stack cm-stack--lg">
        <h1 className="cm-sign-xl">See you at {site.legalAge}</h1>
        <p className="cm-lede cm-measure">This site is for people {site.legalAge} and older.</p>
        <Link className="cm-btn cm-body-strong" href={routes.home}>
          I am {site.legalAge} or older
        </Link>
      </div>
    </section>
  );
}
