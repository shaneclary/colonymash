"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routes } from "@/content/site";

/** Two primary mobile actions; directions remain in the Visit page and menu. */
export function ActionBar() {
  const pathname = usePathname();
  // The business portals have their own task-specific controls.
  if (pathname === "/portal" || pathname.startsWith("/portal/")) return null;
  return <nav data-theme="paper" className="cm-actionbar cm-actionbar--fixed cm-root" aria-label="Quick actions">
    <Link className="cm-btn cm-body-strong" href={routes.onTap}>On tap</Link>
    <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.order}>Cans & kegs</Link>
  </nav>;
}
