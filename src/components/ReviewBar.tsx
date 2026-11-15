import Link from "next/link";
import { questions } from "@/content/questions";
import { routes, site } from "@/content/site";

/** Staging only: says this is a draft and where the open questions are. Gone when the site goes live. */
export function ReviewBar() {
  if (!site.reviewMode) return null;
  return (
    <aside data-theme="paper" className="cm-review cm-root cm-small" aria-label="Draft notice">
      <span>Draft for review. Not public yet.</span>
      <Link className="cm-link cm-body-strong" href={routes.confirm}>
        {questions.length} things to confirm
      </Link>
    </aside>
  );
}
