"use client";

// What staff have changed for the public: this week's hours and listed events.
// Read once per visit from the live database. If that fails, or the site has no database,
// the hours file stands on its own.
import { useEffect, useState } from "react";
import { schedule as fileSchedule } from "@/content/hours";
import { live } from "@/content/site";
import { callRpc, publicEvents, weekExceptions, withExceptions, type PublicEvent } from "@/lib/live-rpc";
import { localMoment, type Schedule } from "@/lib/status";

type PublicSite = { schedule: Schedule; events: PublicEvent[] };
const fallback: PublicSite = { schedule: fileSchedule, events: [] };
const cacheKey = "cm-public-site-v1";
const CACHE_MS = 5 * 60_000;
let inFlight: Promise<PublicSite> | null = null;

function build(raw: { weekHours?: unknown; events?: unknown }): PublicSite {
  const today = localMoment(new Date(), fileSchedule.timeZone).isoDate;
  return { schedule: withExceptions(fileSchedule, weekExceptions(raw.weekHours, today)), events: publicEvents(raw.events, today) };
}
async function load(): Promise<PublicSite> {
  if (!live) return fallback;
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey) || "null") as { at: number; raw: object } | null;
    if (cached && Date.now() - cached.at < CACHE_MS) return build(cached.raw);
  } catch { /* no cache */ }
  try {
    const raw = await callRpc<{ weekHours?: unknown; events?: unknown }>(live, "public_site", {});
    try { sessionStorage.setItem(cacheKey, JSON.stringify({ at: Date.now(), raw })); } catch { /* not cached */ }
    return build(raw ?? {});
  } catch { return fallback; }
}

export function usePublicSite(): PublicSite {
  const [site, setSite] = useState<PublicSite>(fallback);
  useEffect(() => {
    if (!live) return;
    let current = true;
    inFlight ??= load();
    void inFlight.then(next => { if (current) setSite(next); });
    return () => { current = false; };
  }, []);
  return site;
}
