import Link from "next/link";
import type { QuestionId } from "@/content/questions";
import { routes, site } from "@/content/site";

/**
 * A dashed "Confirm" tag beside a fact the owners have not confirmed yet.
 * It links to the question at /confirm. It only shows on the staging site.
 */
export function Confirm({ id }: { id: QuestionId }) {
  if (!site.reviewMode) return null;
  return (
    <Link className="cm-tag cm-tag--dashed cm-label" href={`${routes.confirm}#${id}`}>
      Confirm
    </Link>
  );
}
