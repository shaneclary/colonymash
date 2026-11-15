"use client";

// One line above the header for a change to the plan: closed for a holiday, a new seltzer.
// Set it in src/content/notice.ts. It takes itself down when it expires.
import Link from "next/link";
import { useEffect, useState } from "react";
import { notice } from "@/content/notice";

export function NoticeBanner() {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (notice && Date.parse(notice.expires) <= Date.now()) setExpired(true);
  }, []);
  if (!notice || expired) return null;

  const tone = notice.tone === "plain" ? "" : notice.tone === "loud" ? " cm-notice--loud" : ` cm-flavor--${notice.tone}`;
  return (
    <aside data-theme="paper" className="cm-root" aria-label="Notice">
      <div className={`cm-notice${tone}`}>
        <span className="cm-notice__label cm-sign-sm">{notice.label}</span>
        <span className="cm-notice__text cm-body">{notice.text}</span>
        {notice.link ? (
          <Link className="cm-link cm-body-strong" href={notice.link.href}>
            {notice.link.label}
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
