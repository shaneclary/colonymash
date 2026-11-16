"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PortalRole } from "@/content/portal-demo";
import { usePortalSession } from "./useDemoPortal";

export function PortalFrame({ role, title, subtitle, children, actions }: {
  role: PortalRole;
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { ready, signOut } = usePortalSession(role);
  if (!ready) return <section className="cm-portal cm-portal__loading" aria-live="polite">
    <p>Checking sample session…</p><Link href="/portal">Return to demo login</Link>
  </section>;
  return <div className="cm-portal cm-portal--dashboard">
    <div className="cm-portal__demo-ribbon"><strong>SIMULATED DATA / PUBLIC PREVIEW</strong><span>NOT SECURE · NO REAL TRANSACTIONS OR PRODUCTION RECORDS</span></div>
    <header className="cm-portal__dashboard-head">
      <div className="cm-portal__inner cm-portal__dashboard-head-inner">
        <div>
          <p className="cm-portal__overline">CM/OS · {role === "admin" ? "BREWERY OPERATIONS" : "MERCHANT TRADE"}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="cm-portal__head-actions">
          {actions}
          <button type="button" className="cm-portal__button" onClick={signOut}>Switch demo account ↗</button>
        </div>
      </div>
    </header>
    <div className="cm-portal__inner cm-portal__content">{children}</div>
    <footer className="cm-portal__bottom">
      <div className="cm-portal__inner"><span>COLONY MASH / OPERATIONS CONCEPT</span><span>ALL METRICS, STOCK, CUSTOMERS, RECIPES &amp; ORDERS ARE FAKE</span></div>
    </footer>
  </div>;
}
