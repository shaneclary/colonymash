"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { demoAccounts } from "@/content/portal-demo";
import { demoLogin, getSavedDemoRole } from "./useDemoPortal";

export function PortalLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<"admin" | "merchant" | null>(null);
  useEffect(() => { setCurrent(getSavedDemoRole()); }, []);
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const role = demoLogin(email, password);
    if (!role) {
      setError("Use one of the demo accounts below. No real account authentication is active.");
      return;
    }
    setError("");
    router.push(role === "admin" ? "/portal/admin" : "/portal/trade");
  }
  return <div className="cm-portal cm-portal--login">
    <section className="cm-portal__intro" data-theme="ink">
      <div className="cm-portal__inner cm-portal__intro-grid">
        <div>
          <p className="cm-portal__overline">COLONY MASH / THE OPERATING SYSTEM</p>
          <h1>ONE BREWERY.<br/>TWO SIDES.</h1>
          <p>Staff operations and a merchant ordering experience, built to work from the same inventory and order ledger.</p>
          <div className="cm-portal__intro-actions"><Link href="/">← Back to the brewery</Link></div>
        </div>
        <div className="cm-portal__intro-graphic" aria-hidden="true">
          <strong>CM<br/>OS</strong><span>OPERATIONS / TRADE / INVENTORY / PRODUCTION</span>
        </div>
      </div>
    </section>
    <section className="cm-portal__section">
      <div className="cm-portal__inner cm-portal__login-grid">
        <div className="cm-portal__login-panel">
          <p className="cm-portal__overline">PORTAL ACCESS / SANDBOX</p>
          <h2>Sign in to the demo</h2>
          <p className="cm-portal__muted">These are public sample credentials for Erik to explore the two interfaces. They are not secure business logins.</p>
          <form onSubmit={signIn} className="cm-portal__form">
            <label htmlFor="demo-email">Sample email
              <input id="demo-email" type="email" autoComplete="off" required value={email}
                onChange={e => setEmail(e.target.value)} placeholder="Choose a sample account below"/>
            </label>
            <label htmlFor="demo-password">Sample password
              <input id="demo-password" type="text" autoComplete="off" required value={password}
                onChange={e => setPassword(e.target.value)} placeholder="Demo password"/>
            </label>
            {error && <p role="alert" className="cm-portal__error">{error}</p>}
            <button type="submit" className="cm-portal__button cm-portal__button--dark">Enter demo portal ↗</button>
          </form>
          {current && <p className="cm-portal__muted">Already in a demo session? <Link className="cm-portal__textlink" href={current === "admin" ? "/portal/admin" : "/portal/trade"}>Open {current === "admin" ? "operations" : "merchant"} dashboard ↗</Link></p>}
        </div>
        <aside className="cm-portal__sample" aria-label="Public sample accounts">
          <p className="cm-portal__overline">SAMPLE LOGINS / CLICK TO FILL</p>
          <h2>Explore both sides</h2>
          {demoAccounts.map((account, index) => <div className="cm-portal__account" key={account.role}>
            <span className="cm-portal__account-no">0{index + 1} / {account.role === "admin" ? "OPERATIONS" : "MERCHANT"}</span>
            <h3>{account.display}</h3>
            <dl><dt>Email</dt><dd>{account.email}</dd><dt>Password</dt><dd>{account.password}</dd></dl>
            <button type="button" className="cm-portal__button" onClick={() => {
              setEmail(account.email); setPassword(account.password); setError("");
            }}>Use this sample login ↗</button>
          </div>)}
          <p className="cm-portal__notice"><strong>DEMO DATA ONLY.</strong> No real inventory, recipes, suppliers, orders, prices, or customer records. Changes are saved only in this browser. Never use this login for actual business access.</p>
        </aside>
      </div>
    </section>
  </div>;
}
