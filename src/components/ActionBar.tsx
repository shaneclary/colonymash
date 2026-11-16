import Link from "next/link";
import { routes } from "@/content/site";

/** Two primary mobile actions; directions remain in the Visit page and menu. */
export function ActionBar() {
  return <nav data-theme="paper" className="cm-actionbar cm-actionbar--fixed cm-root" aria-label="Quick actions">
    <Link className="cm-btn cm-body-strong" href={routes.onTap}>On tap</Link>
    <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.order}>Cans & kegs</Link>
  </nav>;
}
