import { test } from "node:test";
import assert from "node:assert/strict";
import { schedule } from "../content/hours.ts";
import { hoursOn } from "./status.ts";
import { callRpc, liveConfig, publicEvents, rpcRequest, weekExceptions, withExceptions } from "./live-rpc.ts";
import { emptyLedger } from "./cloud-ledger.ts";
import { setWeekDay } from "./taproom-week.ts";

const today = "2026-11-16";
const config = { url: "https://example.supabase.co", key: "sb_publishable_0123456789abcdef" };

test("live mode needs both an address and a key", () => {
  assert.deepEqual(liveConfig(" https://example.supabase.co/ ", " sb_publishable_0123456789abcdef "), config);
  assert.equal(liveConfig(undefined, "sb_publishable_0123456789abcdef"), null);
  assert.equal(liveConfig("https://example.supabase.co", ""), null);
  assert.equal(liveConfig("not a url", "sb_publishable_0123456789abcdef"), null);
});

test("a database call posts named arguments with the public key", async () => {
  const { url, init } = rpcRequest(config, "ledger_get", { p_key: "cm_x" });
  assert.equal(url, "https://example.supabase.co/rest/v1/rpc/colonymash_ledger_get");
  assert.equal(init.method, "POST");
  assert.deepEqual(init.headers, { apikey: config.key, "Content-Type": "application/json" });
  assert.equal(init.body, '{"p_key":"cm_x"}');
  const seen: string[] = [];
  const ok = (async (input: string) => { seen.push(input); return new Response('{"ok":true,"version":3}', { status: 200 }); }) as unknown as typeof fetch;
  assert.deepEqual(await callRpc(config, "ledger_get", { p_key: "cm_x" }, ok), { ok: true, version: 3 });
  assert.deepEqual(seen, [url]);
  const down = (async () => new Response("nope", { status: 503 })) as unknown as typeof fetch;
  await assert.rejects(callRpc(config, "ledger_get", {}, down), /503/);
});

test("only the days staff actually changed become public exceptions", () => {
  let state = setWeekDay(emptyLedger(), "2026-11-23", 3, { kind: "closed", note: "Thanksgiving" }).state; // Thu Nov 26
  state = setWeekDay(state, "2026-11-23", 2, { kind: "open", opens: "15:00", closes: "21:00" }).state;   // Wed Nov 25
  state = setWeekDay(state, "2026-11-23", 4, { note: "Live music" }).state;                              // Fri, same hours, a note
  assert.deepEqual(weekExceptions(state.weekHours), [
    { date: "2026-11-25", hours: { kind: "open", opens: "15:00", closes: "21:00" }, reason: "Hours changed this week" },
    { date: "2026-11-26", hours: { kind: "closed" }, reason: "Thanksgiving" },
    { date: "2026-11-27", hours: { kind: "open", opens: "16:00", closes: "20:00" }, reason: "Live music" },
  ]);
  assert.deepEqual(weekExceptions(state.weekHours, "2026-11-27").map(x => x.date), ["2026-11-27"]);
  const live = withExceptions(schedule, weekExceptions(state.weekHours));
  assert.deepEqual(hoursOn("2026-11-26", "thu", live), { kind: "closed" });
  assert.deepEqual(hoursOn("2026-11-19", "thu", live), { kind: "open", opens: "16:00", closes: "20:00" }); // other weeks untouched
  assert.equal(withExceptions(schedule, []), schedule);
});

test("hours and events from the database are checked before the public site uses them", () => {
  assert.deepEqual(weekExceptions(null), []);
  assert.deepEqual(weekExceptions({ "2026-11-23": "nope", "bad-date": [], "2026-11-30": [1, 2, 3] }), []);
  const week = Array.from({ length: 7 }, () => ({ kind: "open", opens: "25:00", closes: "9" }));
  assert.deepEqual(weekExceptions({ "2026-11-23": week }), []);
  assert.deepEqual(publicEvents("nope"), []);
  const events = publicEvents([
    { id: "a", title: " Release night ", date: "2026-11-28", start: "16:00", end: "20:00", note: "Two new seltzers." },
    { id: "b", title: "Past", date: "2026-11-01", start: "16:00", end: "20:00" },
    { id: "c", title: "", date: "2026-11-29", start: "16:00", end: "20:00" },
    { id: "d", title: "Bad time", date: "2026-11-29", start: "4pm", end: "20:00" },
    null,
  ], today);
  assert.deepEqual(events, [{ id: "a", title: "Release night", date: "2026-11-28", start: "16:00", end: "20:00", note: "Two new seltzers." }]);
});

