"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { nav } from "@/content/site";

/** The header links. The page you are on gets a bar under it. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="cm-header__nav">
      {nav.map((link) => {
        const current = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <li key={link.href}>
            <Link className="cm-header__link cm-body-strong" href={link.href} aria-current={current ? "page" : undefined}>
              {link.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
