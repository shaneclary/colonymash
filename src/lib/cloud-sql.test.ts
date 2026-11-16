// Runs the real migration in an in-process Postgres and exercises every function the site calls,
// as the `anon` role the browser uses.
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { demoSeed } from "../content/portal-demo.ts";

const migration = readFileSync(new URL("../../supabase/migrations/20261116_colonymash_staff_ledger.sql", import.meta.url), "utf8");
const db = new PGlite();
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
type Reply = Record<string, unknown> & { ok?: boolean };
async function call(fn: string, args: unknown[] = []): Promise<Reply> {
  const marks = args.map((_, i) => "$" + (i + 1)).join(", ");
  const result = await db.query<{ r: Reply }>("select public." + fn + "(" + marks + ") as r", args as never[]);
  return result.rows[0].r;
}
let key = "";

before(async () => {
  await db.exec("create role anon nologin; create role authenticated nologin;");
  await db.exec(migration);
  await db.exec("set role anon");
});

test("the API role cannot read the tables directly", async () => {
  await assert.rejects(db.query("select * from colonymash.ledger"), /permission denied/);
  await assert.rejects(db.query("select * from colonymash.staff"), /permission denied/);
  await assert.rejects(db.query("select colonymash.new_key()"), /permission denied/);
});

test("setup works once and hands back the first key", async () => {
  assert.equal((await call("colonymash_setup", [" "])).reason, "name");
  const first = await call("colonymash_setup", ["Shane"]);
  assert.equal(first.ok, true);
  key = String(first.key);
  assert.match(key, /^cm_[0-9a-f]{64}$/);
  assert.deepEqual(await call("colonymash_setup", ["Someone else"]), { ok: false, reason: "already_set_up" });
});

test("a wrong, short or missing key is denied everywhere", async () => {
  for (const bad of ["", "cm_short", key.slice(0, -1) + "x", null]) {
    assert.equal((await call("colonymash_ledger_get", [bad])).ok, false);
    assert.equal((await call("colonymash_ledger_save", [bad, 0, seed])).reason, "denied");
    assert.equal((await call("colonymash_staff_list", [bad])).ok, false);
    assert.equal((await call("colonymash_staff_add", [bad, "Erik"])).ok, false);
  }
});

test("an unsaved ledger reads as version 0, then saves count up", async () => {
  const empty = await call("colonymash_ledger_get", [key]);
  assert.deepEqual([empty.ok, empty.name, empty.version, empty.data], [true, "Shane", 0, null]);
  assert.match(String(empty.feedToken), /^[0-9a-f]{64}$/);
  assert.deepEqual(await call("colonymash_ledger_save", [key, 0, seed]), { ok: true, version: 1 });
  const changed = { ...seed, events: [...seed.events, { id: "EV-X", title: "Private tasting", date: "2099-01-02", start: "17:00", end: "19:00", note: "", listed: false }] };
  assert.deepEqual(await call("colonymash_ledger_save", [key, 1, changed]), { ok: true, version: 2 });
  const read = await call("colonymash_ledger_get", [key]);
  assert.equal(read.version, 2);
  assert.equal((read.data as typeof seed).events.length, seed.events.length + 1);
  assert.equal((read.data as typeof seed).orders.length, seed.orders.length);
});

test("a save from a stale copy is refused and gets the current ledger back", async () => {
  const stale = await call("colonymash_ledger_save", [key, 1, seed]);
  assert.deepEqual([stale.ok, stale.reason, stale.version], [false, "conflict", 2]);
  assert.equal((stale.data as typeof seed).events.length, seed.events.length + 1);
  assert.equal((await call("colonymash_ledger_get", [key])).version, 2); // nothing was overwritten
  assert.equal((await call("colonymash_ledger_save", [key, 0, seed])).reason, "conflict");
});

test("only a real ledger can be saved", async () => {
  assert.equal((await call("colonymash_ledger_save", [key, 2, { version: 3, orders: [] }])).reason, "invalid");
  assert.equal((await call("colonymash_ledger_save", [key, 2, { version: 4 }])).reason, "invalid");
  assert.equal((await call("colonymash_ledger_save", [key, 2, [1, 2]])).reason, "invalid");
  assert.equal((await call("colonymash_ledger_save", [key, 2, null])).reason, "invalid");
});

test("the public site reads changed hours and listed upcoming events, nothing else", async () => {
  const week = [0, 1, 2, 3, 4, 5, 6].map(() => ({ kind: "closed", opens: "16:00", closes: "20:00", note: "" }));
  const withWeek = { ...seed, weekHours: { "2099-01-05": week }, events: [
    { id: "A", title: "Listed, upcoming", date: "2099-01-09", start: "16:00", end: "20:00", note: "n", listed: true },
    { id: "B", title: "Staff only", date: "2099-01-09", start: "12:00", end: "13:00", note: "", listed: false },
    { id: "C", title: "Listed, long past", date: "2020-01-01", start: "12:00", end: "13:00", note: "", listed: true },
  ] };
  assert.equal((await call("colonymash_ledger_save", [key, 2, withWeek])).ok, true);
  const site = await call("colonymash_public_site") as { weekHours: Record<string, unknown[]>; events: { id: string }[] };
  assert.deepEqual(Object.keys(site).sort(), ["events", "weekHours"]);
  assert.equal(site.weekHours["2099-01-05"].length, 7);
  assert.deepEqual(site.events.map(x => x.id), ["A"]);
  assert.deepEqual(Object.keys(site.events[0]).sort(), ["date", "end", "id", "note", "start", "title"]);
});

test("the calendar token reads the ledger without account notes, and only with a real token", async () => {
  const token = String((await call("colonymash_ledger_get", [key])).feedToken);
  const feed = await call("colonymash_calendar", [token]) as unknown as typeof seed;
  assert.equal(feed.orders.length, seed.orders.length);
  assert.deepEqual(feed.accountNotes, []);
  assert.ok(seed.accountNotes.length > 0);
  assert.equal(await call("colonymash_calendar", ["0".repeat(64)]), null);
  assert.equal(await call("colonymash_calendar", [key]), null); // an access key is not a feed token
  assert.equal((await call("colonymash_ledger_get", [token])).ok, false); // and a feed token cannot sign in
});

test("staff add each other, and a removed key stops working", async () => {
  const erik = await call("colonymash_staff_add", [key, "Erik"]);
  assert.equal(erik.ok, true);
  const erikKey = String(erik.key);
  assert.notEqual(erikKey, key);
  assert.equal((await call("colonymash_ledger_get", [erikKey])).name, "Erik");
  const list = (await call("colonymash_staff_list", [key])).staff as { id: string; name: string; me: boolean }[];
  assert.deepEqual(list.map(x => [x.name, x.me]), [["Shane", true], ["Erik", false]]);
  const erikFeed = String((await call("colonymash_ledger_get", [erikKey])).feedToken);
  assert.equal((await call("colonymash_staff_remove", [key, list[0].id])).reason, "self");
  assert.equal((await call("colonymash_staff_remove", [key, list[1].id])).ok, true);
  assert.equal((await call("colonymash_ledger_get", [erikKey])).ok, false);
  assert.equal(await call("colonymash_calendar", [erikFeed]), null);
  assert.equal(((await call("colonymash_staff_list", [key])).staff as unknown[]).length, 1);
  // Saves are stamped with who made them (checked as the owner role).
  await db.exec("reset role");
  const row = await db.query<{ updated_by: string; version: number }>("select updated_by, version from colonymash.ledger");
  assert.deepEqual(row.rows, [{ updated_by: "Shane", version: 3 }]);
});
