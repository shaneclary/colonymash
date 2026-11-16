import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import {
  accountInsights, accountsByAttention, addAccount, addAccountNote, editAccount, logKegReturn, removeAccountNote, setFollowUp,
} from "./accounts.ts";
import { transitionOrder } from "./portal-forecast.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));

test("an account shows its order history, rhythm and open work", () => {
  const coastal = accountInsights(seed, merchantDemoId, today);
  assert.deepEqual(coastal.orders.map(x => x.id), ["DEMO-1003", "DEMO-1001"]); // newest first
  assert.deepEqual([coastal.openOrders, coastal.filledOrders, coastal.lastOrderDate, coastal.daysSinceLast, coastal.usualGapDays],
    [2, 0, "2026-11-14", 1, 3]);
  assert.equal(coastal.reorderDue, false);
  assert.equal(coastal.requests.length, 1);
  assert.equal(coastal.notes.length, 1);
});

test("filled volume, top drinks and kegs out come from filled orders", () => {
  const venue = accountInsights(seed, "venue-demo", today);
  assert.ok(Math.abs(venue.filledLiters - 234.68) < 0.001);
  assert.deepEqual(venue.topProducts.map(x => x.productId), ["purple-reign"]);
  assert.equal(venue.kegsOut, 2); // 4 filled, 2 logged back
  const more = transitionOrder(seed, "DEMO-1002", "fulfilled", today);
  assert.equal(accountInsights(more, "venue-demo", today).kegsOut, 5);
});

test("an active account that goes quiet past its own rhythm is flagged", () => {
  assert.equal(accountInsights(seed, merchantDemoId, "2026-11-20").reorderDue, false); // 6 days, limit is 7
  assert.equal(accountInsights(seed, merchantDemoId, "2026-11-23").reorderDue, true);
  assert.equal(accountInsights(seed, "prospect-demo", "2027-06-01").reorderDue, false); // prospects have no rhythm
  const paused = editAccount(seed, merchantDemoId, "status", "paused");
  assert.equal(accountInsights(paused, merchantDemoId, "2026-11-23").reorderDue, false);
});

test("follow-ups set, clear and sort accounts to the top when due", () => {
  assert.equal(accountInsights(seed, "prospect-demo", today).followUpDue, true);   // was due yesterday
  assert.equal(accountInsights(seed, merchantDemoId, today).followUpDue, false);    // due in three days
  assert.deepEqual(accountsByAttention(seed, today).map(x => x.account.id), ["prospect-demo", merchantDemoId, "venue-demo"]);
  const cleared = setFollowUp(seed, "prospect-demo", "");
  assert.equal(accountInsights(cleared, "prospect-demo", today).followUpDue, false);
  assert.equal(setFollowUp(seed, "prospect-demo", "2026-12-01").accounts.find(x => x.id === "prospect-demo")?.followUpOn, "2026-12-01");
  assert.equal(setFollowUp(seed, "prospect-demo", "soon"), seed);
});

test("notes log against an account, newest first, and can be removed", () => {
  const added = addAccountNote(seed, merchantDemoId, "call", "  Asked about a holiday keg order. ", today, "N-9");
  assert.equal(added.error, undefined);
  const notes = accountInsights(added.state, merchantDemoId, today).notes;
  assert.deepEqual(notes[0], { id: "N-9", merchantId: merchantDemoId, at: today, kind: "call", text: "Asked about a holiday keg order." });
  assert.equal(notes.length, 2);
  assert.ok(addAccountNote(seed, merchantDemoId, "note", "  ", today, "N-9").error);
  assert.ok(addAccountNote(seed, "missing", "note", "Hello", today, "N-9").error);
  assert.ok(addAccountNote(added.state, merchantDemoId, "note", "Again", today, "N-9").error);
  assert.equal(removeAccountNote(added.state, "N-9").accountNotes.length, seed.accountNotes.length);
});

test("account details edit field by field, with status and tags checked", () => {
  let state = editAccount(seed, merchantDemoId, "address", "500 New Street, Cayucos, CA");
  state = editAccount(state, merchantDemoId, "tags", "Draft, patio , draft,,");
  const account = state.accounts.find(x => x.id === merchantDemoId);
  assert.equal(account?.address, "500 New Street, Cayucos, CA");
  assert.deepEqual(account?.tags, ["draft", "patio"]);
  assert.equal(editAccount(seed, merchantDemoId, "status", "vip"), seed);
  assert.equal(editAccount(seed, merchantDemoId, "name", " "), seed);
  assert.equal(editAccount(seed, "missing", "address", "x"), seed);
});

test("a new account starts as a prospect, once", () => {
  const added = addAccount(seed, "  Harbor Taphouse ", today, "ACC-9");
  assert.equal(added.error, undefined);
  assert.deepEqual([added.state.accounts.at(-1)?.name, added.state.accounts.at(-1)?.status, added.state.accounts.at(-1)?.since], ["Harbor Taphouse", "prospect", today]);
  assert.ok(addAccount(added.state, "harbor taphouse", today, "ACC-10").error);
  assert.ok(addAccount(seed, " ", today, "ACC-9").error);
});

test("keg returns cannot exceed the kegs that are out", () => {
  const back = logKegReturn(seed, "venue-demo", 2, today);
  assert.equal(accountInsights(back, "venue-demo", today).kegsOut, 0);
  assert.equal(logKegReturn(seed, "venue-demo", 3, today), seed);
  assert.equal(logKegReturn(seed, merchantDemoId, 1, today), seed);
  assert.equal(logKegReturn(seed, "venue-demo", 0, today), seed);
});
