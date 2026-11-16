"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { demoAccounts, demoSeed, type DemoState, type PortalRole } from "@/content/portal-demo";

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

function isDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  if (state.version !== 1 || !Array.isArray(state.ingredients) || !Array.isArray(state.orders) ||
      !Array.isArray(state.production) || !Array.isArray(state.finished)) return false;
  return state.ingredients.every(x => x && typeof x === "object" && typeof x.id === "string" &&
    typeof x.onHand === "number" && Number.isFinite(x.onHand) && x.onHand >= 0) &&
    state.finished.every(x => x && typeof x === "object" && typeof x.productId === "string" &&
      ["can", "six_pack", "keg"].every(key => Number.isSafeInteger(x[key]) && x[key] >= 0)) &&
    state.production.every(x => x && typeof x === "object" && typeof x.recipeId === "string" &&
      Number.isSafeInteger(x.batches) && x.batches >= 0) &&
    state.orders.every(x => x && typeof x === "object" && typeof x.id === "string" &&
      Array.isArray(x.lines) && typeof x.status === "string");
}

/** Persistent only in this browser on this site. Multiple tabs see the same demo ledger. */
export function useDemoLedger() {
  const [state, setState] = useState<DemoState>(() => demoSeed());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(stateKey) || "null");
      if (isDemoState(saved)) setState(saved);
    } catch { /* corrupted or disabled storage: use sample state */ }
    setLoaded(true);
    function onStorage(event: StorageEvent) {
      if (event.key !== stateKey || !event.newValue) return;
      try {
        const next: unknown = JSON.parse(event.newValue);
        if (isDemoState(next)) setState(next);
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

  const reset = useCallback(() => {
    setState(demoSeed());
  }, []);

  const updateFinished = useCallback((productId: string, format: "can" | "six_pack" | "keg", quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100000) return;
    setState(current => ({
      ...current, finished: current.finished.map(x => x.productId === productId ? { ...x, [format]: quantity } : x),
    }));
  }, []);

  return { state, setState, loaded, reset, updateFinished };
}
