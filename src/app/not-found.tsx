import Link from "next/link";
import { routes } from "@/content/site";

export default function NotFound() {
  return (
    <section data-theme="paper" className="cm-section cm-root">
      <div className="cm-wrap cm-stack cm-stack--lg">
        <h1 className="cm-sign-xl">That page is not on the list</h1>
        <p className="cm-lede cm-measure">The link is old or the address was mistyped.</p>
        <div className="cm-actions">
          <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.onTap}>
            See what&apos;s on tap
          </Link>
          <Link className="cm-btn cm-body-strong" href={routes.visit}>
            Hours and directions
          </Link>
        </div>
      </div>
    </section>
  );
}
