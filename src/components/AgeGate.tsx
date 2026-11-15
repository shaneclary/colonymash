"use client";

// Asks a visitor to confirm they are of age, once, and remembers a "yes" on that device.
// The gate is in the page's HTML from the start, so nothing shows behind it while scripts load.
// A small script in layout.tsx hides it before first paint for a visitor who has already answered.
// The address, hours link and phone stay readable on the gate itself.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { routes, site } from "@/content/site";

const STORAGE_KEY = "cm-age-ok";
const PASSED_CLASS = "cm-age-ok";
/** Pages a visitor can read without answering. */
const openPaths: string[] = [routes.under21, routes.confirm];

export function AgeGate() {
  const pathname = usePathname();
  const yesButton = useRef<HTMLButtonElement>(null);
  const skip = openPaths.includes(pathname);

  useEffect(() => {
    const page = document.getElementById("site");
    const passed = document.documentElement.classList.contains(PASSED_CLASS);
    if (skip || passed) {
      page?.removeAttribute("inert");
      return;
    }
    // Keep the keyboard and screen readers on the question until it is answered.
    page?.setAttribute("inert", "");
    yesButton.current?.focus();
    return () => page?.removeAttribute("inert");
  }, [skip]);

  if (skip) return null;

  const confirmAge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // Private browsing: the answer just lasts for this page view.
    }
    document.documentElement.classList.add(PASSED_CLASS);
    document.getElementById("site")?.removeAttribute("inert");
  };

  return (
    <div data-theme="ink" className="cm-gate-overlay cm-root" role="dialog" aria-modal="true" aria-labelledby="age-question">
      <div className="cm-gate">
        <span className="cm-logo cm-logo--gate" role="img" aria-label={`${site.fullName} logo`} />
        <h2 className="cm-sign-lg" id="age-question">
          Are you {site.legalAge} or older?
        </h2>
        <div className="cm-gate__actions">
          <button className="cm-btn cm-btn--primary cm-body-strong" type="button" onClick={confirmAge} ref={yesButton}>
            Yes
          </button>
          <Link className="cm-btn cm-body-strong" href={routes.under21}>
            No
          </Link>
        </div>
        <p className="cm-gate__fine cm-small">
          {site.address.street}, {site.address.city}.{" "}
          <a className="cm-link cm-nowrap" href={site.phone.href}>
            {site.phone.display}
          </a>
        </p>
      </div>
    </div>
  );
}
