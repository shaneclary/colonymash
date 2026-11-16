"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { nav, routes, site } from "@/content/site";

/** Desktop menu and a compact mobile disclosure. */
export function NavLinks() {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);
  const isCurrent = (href: string) => pathname === href || pathname.startsWith(href + "/");
  return <>
    <ul className="cm-header__nav">
      {nav.map((link) => <li key={link.href}>
        <Link className="cm-header__link cm-body-strong" href={link.href}
          aria-current={isCurrent(link.href) ? "page" : undefined}>{link.label}</Link>
      </li>)}
    </ul>
    <details className="cm-mobile-menu" ref={menu}>
      <summary aria-label="Toggle navigation menu">
        <span>Menu</span><span className="cm-mobile-menu__lines" aria-hidden="true"><i/><i/><i/></span>
      </summary>
      <ul className="cm-mobile-menu__list">
        {nav.map((link) => <li key={link.href}>
          <Link href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined}
            onClick={() => menu.current?.removeAttribute("open")}>{link.label}</Link>
        </li>)}
        <li><Link href={routes.story} onClick={() => menu.current?.removeAttribute("open")}>Our story</Link></li>
        <li><a href={site.directionsUrl}>Get directions ↗</a></li>
      </ul>
    </details>
  </>;
}
