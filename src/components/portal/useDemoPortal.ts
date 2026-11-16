"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { demoAccounts, demoSeed, type DemoState, type PortalRole } from "@/content/portal-demo";
import { upgradeDemoLedger } from "@/lib/merchant-operations";

const stateKey = "cm-simulated-portal-v1";
const sessionKey = "cm-simulated-role-v1";

/** A public demo; sessionStorage is NOT authorization and never protects business data. */
export function usePortalSession(required: PortalRole) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let role: string | null = null;
    try { role = sessionStorage.getItem(sessionKey); } catch { /* restricted storage */ }
    if (role !== required) {
      router.replace("/portal");
    } else {
      setReady(true);
    }
  }, [required, router]);
  const signOut = useCallback(() => {
    try { sessionStorage.removeItem(sessionKey); } catch { /* ignore */ }
    router.push("/portal");
  }, [router]);
  return { ready, signOut };
}
export function demoLogin(email: string, password: string): PortalRole | null {
  const account = demoAccounts.find(x => x.email.toLowerCase() === email.toLowerCase().trim() && x.password === password);
  if (!account) return null;
  try { sessionStorage.setItem(sessionKey, account.role); } catch { return null; }
  return account.role;
}
export function getSavedDemoRole(): PortalRole | null {
  try {
    const role = sessionStorage.getItem(sessionKey);
    return role === "admin" || role === "merchant" ? role : null;
  } catch { return null; }
}

export type UndoEntry = { label: string; state: DemoState };

/** Persistent only in this browser on this site. Multiple tabs see the same demo ledger. */
export function useDemoLedger() {
  const [state, setState] = useState<DemoState>(() => demoSeed());
  const [loaded, setLoaded] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const latest = useRef(state);
  const stack = useRef<UndoEntry[]>([]);
  useEffect(() => { latest.current = state; }, [state]);

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(stateKey) || "null");
      const saved = upgradeDemoLedger(parsed, demoSeed());
      if (saved) setState(saved);
    } catch { /* corrupted or disabled storage: use sample state */ }
    setLoaded(true);
    function onStorage(event: StorageEvent) {
      if (event.key !== stateKey || !event.newValue) return;
      try {
        const parsed: unknown = JSON.parse(event.newValue);
        const next = upgradeDemoLedger(parsed, demoSeed());
        if (next) setState(next);
      } catch { /* ignore malformed updates */ }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(stateKey, JSON.stringify(state)); }
    catch { /* private browsing: transient local state */ }
  }, [state, loaded]);

  /**
   * Make a change that can be undone. Repeated changes with the same label (typing in one field)
   * fold into one undo step, so Undo takes the field back to where it started.
   */
  const commit = useCallback((label: string, change: (current: DemoState) => DemoState): boolean => {
    const before = latest.current;
    const next = change(before);
    if (next === before) return false;
    if (stack.current[0]?.label !== label) stack.current = [{ label, state: before }, ...stack.current].slice(0, 25);
    latest.current = next;
    setUndoStack(stack.current);
    setState(next);
    return true;
  }, []);

  /** Take back the most recent change. Returns its label. */
  const undo = useCallback((): string | null => {
    const [top, ...rest] = stack.current;
    if (!top) return null;
    stack.current = rest;
    latest.current = top.state;
    setUndoStack(rest);
    setState(top.state);
    return top.label;
  }, []);

  return { state, setState, loaded, commit, undo, undoStack };
}
