import Link from "next/link";
import { routes, site } from "@/content/site";

/** The three things a phone visitor came for, pinned to the bottom of the screen. */
export function ActionBar() {
  return (
    <nav data-theme="paper" className="cm-actionbar cm-actionbar--fixed cm-root" aria-label="Quick actions">
      <a className="cm-btn cm-btn--primary cm-body-strong" href={site.directionsUrl}>
        Directions
      </a>
      <a className="cm-btn cm-body-strong" href={site.phone.href}>
        Call
      </a>
      <Link className="cm-btn cm-body-strong" href={routes.onTap}>
        On tap
      </Link>
    </nav>
  );
}
