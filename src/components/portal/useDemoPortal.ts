"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { demoAccounts, demoSeed, type DemoState, type PortalRole } from "@/content/portal-demo";
import { upgradeDemoLedger } from "@/lib/merchant-operations";
import { emptyLedger } from "@/lib/cloud-ledger";
import { callRpc, type RpcReply } from "@/lib/live-rpc";
import { live } from "@/content/site";

const stateKey = "cm-simulated-portal-v1";
const sessionKey = "cm-simulated-role-v1";
const modeKey = "cm-portal-mode-v1";
const staffKeyKey = "cm-staff-key-v1";

/** The staff access key saved on this device, if the session is a live one. */
export function liveStaffKey(): string {
  try { return live && sessionStorage.getItem(modeKey) === "live" ? localStorage.getItem(staffKeyKey) ?? "" : ""; }
  catch { return ""; }
}
/** Check a staff key with the database. On success the device remembers it and the session goes live. */
export async function liveSignIn(key: string): Promise<{ ok: boolean; error: string }> {
  if (!live) return { ok: false, error: "The live database is not connected on this site." };
  try {
    const reply = await callRpc(live, "ledger_get", { p_key: key.trim() });
    if (!reply.ok) return { ok: false, error: "That key is not recognised." };
    localStorage.setItem(staffKeyKey, key.trim());
    sessionStorage.setItem(modeKey, "live");
    sessionStorage.setItem(sessionKey, "admin");
    return { ok: true, error: "" };
  } catch { return { ok: false, error: "Could not reach the database. Check the connection and try again." }; }
}
/** First-time setup: makes the first staff key. Works only while no staff exist. */
export async function liveSetup(name: string): Promise<{ key: string; error: string }> {
  if (!live) return { key: "", error: "The live database is not connected on this site." };
  try {
    const reply = await callRpc(live, "setup", { p_name: name });
    if (reply.ok && typeof reply.key === "string") return { key: reply.key, error: "" };
    return { key: "", error: reply.reason === "already_set_up" ? "Staff access is already set up. Ask a staff member to add you." : "Enter your name." };
  } catch { return { key: "", error: "Could not reach the database. It may not be set up yet." }; }
}

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
    try {
      // Leaving a live session takes the staff key off this device.
      if (sessionStorage.getItem(modeKey) === "live") localStorage.removeItem(staffKeyKey);
      sessionStorage.removeItem(modeKey);
      sessionStorage.removeItem(sessionKey);
    } catch { /* ignore */ }
    router.push("/portal");
  }, [router]);
  return { ready, signOut };
}
export function demoLogin(email: string, password: string): PortalRole | null {
  const account = demoAccounts.find(x => x.email.toLowerCase() === email.toLowerCase().trim() && x.password === password);
  if (!account) return null;
  try { sessionStorage.setItem(sessionKey, account.role); sessionStorage.removeItem(modeKey); } catch { return null; }
  return account.role;
}
export function getSavedDemoRole(): PortalRole | null {
  try {
    const role = sessionStorage.getItem(sessionKey);
    return role === "admin" || role === "merchant" ? role : null;
  } catch { return null; }
}

export type UndoEntry = { label: string; state: DemoState };
export type SyncState = {
  mode: "demo" | "live" | null;
  status: "idle" | "loading" | "saving" | "saved" | "offline" | "denied";
  staffName: string; feedToken: string;
  /** Something the person should know: another device saved first, or the page caught up. */
  note: string;
};
const SAVE_DELAY_MS = 700;
const POLL_MS = 20_000;

/**
 * The portal's ledger. In the demo it lives in this browser. In a live staff session it lives in the
 * brewery database: loaded on open, saved shortly after each change, and refreshed when another device saves.
 */
export function useDemoLedger(options: { allowLive?: boolean } = {}) {
  const allowLive = options.allowLive === true;
  const [state, setState] = useState<DemoState>(() => demoSeed());
  const [loaded, setLoaded] = useState(false);
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [sync, setSync] = useState<SyncState>({ mode: null, status: "idle", staffName: "", feedToken: "", note: "" });
  const latest = useRef(state);
  const stack = useRef<UndoEntry[]>([]);
  const staffKey = useRef("");
  const version = useRef(0);
  const synced = useRef<DemoState | null>(null);
  const busy = useRef(false);
  const timer = useRef<number | null>(null);
  useEffect(() => { latest.current = state; }, [state]);

  /** Swap in a ledger that came from the database. Undo history no longer applies to it. */
  const adopt = useCallback((next: DemoState, nextVersion: number) => {
    version.current = nextVersion; synced.current = next; latest.current = next; stack.current = [];
    setUndoStack([]); setState(next);
  }, []);
  const fromReply = (reply: RpcReply): DemoState =>
    (reply.data ? upgradeDemoLedger(reply.data, emptyLedger()) : null) ?? emptyLedger();

  useEffect(() => {
    const key = allowLive ? liveStaffKey() : "";
    if (key && live) {
      staffKey.current = key;
      setSync(current => ({ ...current, mode: "live", status: "loading" }));
      let cancelled = false;
      callRpc(live, "ledger_get", { p_key: key }).then(reply => {
        if (cancelled) return;
        if (!reply.ok) { setSync(current => ({ ...current, status: "denied" })); return; }
        adopt(fromReply(reply), Number(reply.version) || 0);
        setSync({ mode: "live", status: "saved", staffName: String(reply.name ?? ""), feedToken: String(reply.feedToken ?? ""), note: "" });
        setLoaded(true);
      }).catch(() => { if (!cancelled) setSync(current => ({ ...current, status: "offline" })); });
      return () => { cancelled = true; };
    }
    setSync(current => ({ ...current, mode: "demo" }));
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
  }, [allowLive, adopt]);

  /** Send the newest ledger to the database. Runs again by itself if more changed while it was away. */
  const save = useCallback(async () => {
    if (!live || busy.current || latest.current === synced.current) return;
    busy.current = true;
    const sending = latest.current;
    let retryIn = 0;
    setSync(current => ({ ...current, status: "saving" }));
    try {
      const reply = await callRpc(live, "ledger_save", { p_key: staffKey.current, p_version: version.current, p_data: sending });
      if (reply.ok) {
        version.current = Number(reply.version); synced.current = sending;
        setSync(current => ({ ...current, status: "saved" }));
      } else if (reply.reason === "conflict") {
        adopt(fromReply(reply), Number(reply.version) || 0);
        setSync(current => ({ ...current, status: "saved", note: "Another device saved first, so your last change was not kept. This is the latest." }));
      } else {
        setSync(current => ({ ...current, status: reply.reason === "denied" ? "denied" : "offline",
          note: reply.reason === "denied" ? "" : "The database refused that save. Nothing was lost on this screen. Try the change again." }));
      }
      // More changed while this save was away: send it straight after.
      if (reply.ok && latest.current !== synced.current) retryIn = 50;
    } catch { setSync(current => ({ ...current, status: "offline" })); retryIn = 4000; }
    busy.current = false;
    if (retryIn && timer.current === null) timer.current = window.setTimeout(() => { timer.current = null; void save(); }, retryIn);
  }, [adopt]);

  useEffect(() => {
    if (!loaded || sync.mode === null) return;
    if (sync.mode === "demo") {
      try { localStorage.setItem(stateKey, JSON.stringify(state)); }
      catch { /* private browsing: transient local state */ }
      return;
    }
    if (state === synced.current) return;
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = null; void save(); }, SAVE_DELAY_MS);
  }, [state, loaded, sync.mode, save]);

  // Pick up what another device saved, when this one has nothing waiting to go out.
  useEffect(() => {
    if (sync.mode !== "live" || !loaded || !live) return;
    const config = live;
    const poll = window.setInterval(async () => {
      if (document.hidden || busy.current || latest.current !== synced.current) return;
      try {
        const reply = await callRpc(config, "ledger_get", { p_key: staffKey.current });
        if (!reply.ok) { setSync(current => ({ ...current, status: "denied" })); return; }
        if (Number(reply.version) > version.current && latest.current === synced.current) {
          adopt(fromReply(reply), Number(reply.version));
          setSync(current => ({ ...current, status: "saved", note: "Updated with changes from another device." }));
        } else setSync(current => current.status === "offline" ? { ...current, status: "saved" } : current);
      } catch { /* offline: the next poll tries again */ }
    }, POLL_MS);
    return () => window.clearInterval(poll);
  }, [sync.mode, loaded, adopt]);

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
    setSync(current => current.note ? { ...current, note: "" } : current);
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

  return { state, setState, loaded, commit, undo, undoStack, sync };
}
