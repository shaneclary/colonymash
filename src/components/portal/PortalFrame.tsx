"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { PortalRole } from "@/content/portal-demo";
import { usePortalSession } from "./useDemoPortal";

export function PortalFrame({ role, title, subtitle, children, actions, live = false }: {
  role: PortalRole;
  title: string;
  subtitle: string;
  children: ReactNode;
  actions?: ReactNode;
  /** A live staff session: real data, saved to the brewery database. */
  live?: boolean;
}) {
  const { ready, signOut } = usePortalSession(role);
  if (!ready) return <section className="cm-portal cm-portal__loading" aria-live="polite">
    <p>Checking your session…</p><Link href="/portal">Return to sign-in</Link>
  </section>;
  return <div className="cm-portal cm-portal--dashboard">
    {live
      ? <div className="cm-portal__demo-ribbon"><strong>LIVE · BREWERY DATA</strong><span>SAVED TO THE BREWERY DATABASE · STAFF ONLY</span></div>
      : <div className="cm-portal__demo-ribbon"><strong>SIMULATED DATA / PUBLIC PREVIEW</strong><span>NOT SECURE · NO REAL TRANSACTIONS OR PRODUCTION RECORDS</span></div>}
    <header className="cm-portal__dashboard-head">
      <div className="cm-portal__inner cm-portal__dashboard-head-inner">
        <div>
          <p className="cm-portal__overline">CM/OS · {role === "admin" ? "BREWERY OPERATIONS" : "MERCHANT TRADE"}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="cm-portal__head-actions">
          {actions}
          <button type="button" className="cm-portal__button" onClick={signOut}>{live ? "Sign out" : "Switch demo account ↗"}</button>
        </div>
      </div>
    </header>
    <div className="cm-portal__inner cm-portal__content">{children}</div>
    <footer className="cm-portal__bottom">
      <div className="cm-portal__inner"><span>COLONY MASH / OPERATIONS</span><span>{live ? "LIVE DATA. KEEP YOUR ACCESS KEY PRIVATE." : "ALL METRICS, STOCK, CUSTOMERS, RECIPES & ORDERS ARE FAKE"}</span></div>
    </footer>
  </div>;
}
