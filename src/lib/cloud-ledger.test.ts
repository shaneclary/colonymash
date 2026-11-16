import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, merchantDemoId } from "../content/portal-demo.ts";
import { emptyLedger, staffCreateOrder } from "./cloud-ledger.ts";
import { upgradeDemoLedger } from "./merchant-operations.ts";
import { accountsByAttention } from "./accounts.ts";
import { calendarEntries } from "./staff-calendar.ts";
import { ingredientForecast } from "./portal-forecast.ts";

const today = "2026-11-16";

test("a real ledger starts empty, in the current shape, and every screen can read it", () => {
  const empty = emptyLedger();
  assert.equal(upgradeDemoLedger(empty, demoSeed()), empty); // accepted as a current ledger
  assert.equal(empty.orders.length + empty.accounts.length + empty.recipes.length + empty.finished.length, 0);
  assert.deepEqual(calendarEntries(empty, today), []);
  assert.deepEqual(ingredientForecast(empty, today), []);
  assert.deepEqual(accountsByAttention(empty, today), []);
});

test("staff can enter an order by hand for a known account", () => {
  const seed = demoSeed(new Date("2026-11-15T12:00:00"));
  const result = staffCreateOrder(seed, merchantDemoId, [
    { productId: "coconut-horchata", format: "keg", quantity: 2 },   // marked unavailable in the demo catalog, but real staff can sell it
    { productId: "coconut-horchata", format: "keg", quantity: 1 },
    { productId: "cherry-limeade", format: "six_pack", quantity: 120 },
    { productId: "not-a-drink", format: "can", quantity: 4 },
  ], "2026-11-20", " Phone order. ", today, "ORD-1");
  assert.equal(result.error, undefined);
  const order = result.state.orders[0];
  assert.deepEqual([order.id, order.status, order.merchantName, order.notes], ["ORD-1", "accepted", "Coastal Partner — Demo", "Phone order."]);
  assert.deepEqual(order.lines, [{ productId: "coconut-horchata", format: "keg", quantity: 3 }, { productId: "cherry-limeade", format: "six_pack", quantity: 120 }]);
  assert.deepEqual(order.history?.map(x => x.status), ["requested", "accepted"]);
  assert.ok(staffCreateOrder(seed, "missing", order.lines, "2026-11-20", "", today, "ORD-1").error);
  assert.ok(staffCreateOrder(seed, merchantDemoId, [], "2026-11-20", "", today, "ORD-1").error);
  assert.ok(staffCreateOrder(seed, merchantDemoId, order.lines, "2026-11-01", "", today, "ORD-1").error);
  assert.ok(staffCreateOrder(result.state, merchantDemoId, order.lines, "2026-11-20", "", today, "ORD-1").error);
  assert.equal(staffCreateOrder(seed, "missing", order.lines, "2026-11-20", "", today, "ORD-1").state, seed);
});
