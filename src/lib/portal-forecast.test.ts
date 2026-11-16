import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed, demoProducts, demoRecipes, demoPackVolumes } from "../content/portal-demo.ts";
import {
  changePlannedBatches, committedOrderLines, createTradeRequest,
  finishedUnitAvailability, ingredientForecast, nextOrderStatus, productionEstimates,
  quantityForTrade, sanitizeTradeLines, transitionOrder, updateIngredient, updateTradeCart, volumeLiters,
} from "./portal-forecast.ts";

const date = new Date("2026-11-15T12:00:00");
const today = "2026-11-15";
test("demo fixtures are intentionally non-live and contain coherent recipes", () => {
  const state = demoSeed(date);
  assert.equal(state.version, 2);
  assert.equal(demoProducts.length, 3);
  for (const recipe of demoRecipes) {
    assert.ok(recipe.yieldLiters > 0);
    for (const line of recipe.bill) assert.ok(state.ingredients.some(i => i.id === line.ingredientId));
  }
  assert.equal(state.orders.find(x => x.id === "DEMO-1003")?.status, "requested");
});
test("buyer lines are bounded and grouped by product and pack size", () => {
  const sanitized = sanitizeTradeLines([
    { productId: "cherry-limeade", format: "keg", quantity: 2 },
    { productId: "cherry-limeade", format: "keg", quantity: 3 },
    { productId: "fake-product", format: "keg", quantity: 20 },
    { productId: "purple-reign", format: "six_pack", quantity: -1 },
  ]);
  assert.deepEqual(sanitized, [{ productId: "cherry-limeade", format: "keg", quantity: 5 }]);
  let cart = updateTradeCart([], "purple-reign", "six_pack", 7);
  cart = updateTradeCart(cart, "purple-reign", "keg", 2);
  assert.equal(quantityForTrade(cart, "purple-reign", "six_pack"), 7);
  assert.equal(quantityForTrade(cart, "purple-reign", "keg"), 2);
  cart = updateTradeCart(cart, "purple-reign", "six_pack", -7);
  assert.equal(quantityForTrade(cart, "purple-reign", "six_pack"), 0);
  assert.equal(quantityForTrade(cart, "purple-reign", "keg"), 2);
});
test("liters equivalent for illustrative 16oz can, 6pack and half barrel", () => {
  assert.equal(demoPackVolumes.six_pack, 6 * demoPackVolumes.can);
  assert.ok(Math.abs(volumeLiters([
    { productId: "cherry-limeade", format: "keg", quantity: 1 },
    { productId: "cherry-limeade", format: "can", quantity: 6 },
  ]) - (demoPackVolumes.keg + 6 * demoPackVolumes.can)) < 0.00001);
});
test("pending requests do not become accepted demand until admin approval", () => {
  const state = demoSeed(date);
  assert.ok(state.orders.some(x => x.status === "requested"));
  const before = volumeLiters(committedOrderLines(state));
  const after = transitionOrder(state, "DEMO-1003", "accepted");
  assert.ok(volumeLiters(committedOrderLines(after)) > before);
  assert.notDeepEqual(productionEstimates(state), productionEstimates(after));
});
test("stock balances are pack-specific and can warn of reservations beyond stock", () => {
  const state = demoSeed(date);
  const response = finishedUnitAvailability(state, "cherry-limeade", "keg");
  assert.equal(response.stock, 1);
  assert.equal(response.committed, 2);
  assert.equal(response.unallocated, -1);
});
test("forecast is sensitive to production plan and inventory receipts", () => {
  const state = demoSeed(date);
  const before = ingredientForecast(state, today);
  assert.ok(before.some(x => x.suggestedOrder > 0));
  const afterMoreBatches = changePlannedBatches(state, "demo-cherry", 4);
  const bigger = ingredientForecast(afterMoreBatches, today);
  const baseBefore = before.find(x => x.item.id === "base");
  const baseAfter = bigger.find(x => x.item.id === "base");
  assert.ok(baseAfter && baseBefore && baseAfter.required > baseBefore.required);
  const withIncoming = updateIngredient(afterMoreBatches, "base", "incoming", 120);
  const improved = ingredientForecast(withIncoming, today).find(x => x.item.id === "base");
  assert.ok(improved && baseAfter && improved.suggestedOrder < baseAfter.suggestedOrder);
});
test("order flow enforces state transitions", () => {
  assert.equal(nextOrderStatus("requested","accepted"), true);
  assert.equal(nextOrderStatus("requested","fulfilled"), false);
  assert.equal(nextOrderStatus("scheduled","fulfilled"), true);
  const state = demoSeed(date);
  assert.equal(transitionOrder(state, "DEMO-1001", "fulfilled").orders.find(o => o.id === "DEMO-1001")?.status, "accepted");
});
test("merchant quote is review-only and cannot be created with invalid lines or dates", () => {
  const state = demoSeed(date);
  const invalid = createTradeRequest(state, "coastal-partner-demo", "Demo", [], "2026-11-23", "", "DEMO-9000", today);
  assert.equal(invalid, state);
  const requested = createTradeRequest(state, "coastal-partner-demo", "Demo",
    [{ productId: "cherry-limeade", format: "keg", quantity: 3 }],
    "2026-11-23", "Interested in delivery", "DEMO-9000", today);
  assert.equal(requested.orders[0].status, "requested");
  assert.equal(requested.orders[0].lines[0].quantity, 3);
  assert.equal(ingredientForecast(requested, today)[0].status, ingredientForecast(state, today)[0].status);
});
test("inventory edits require bounded nonnegative numbers", () => {
  const state = demoSeed(date);
  assert.equal(updateIngredient(state, "fruit", "onHand", -2), state);
  assert.equal(changePlannedBatches(state, "demo-cherry", 2.5), state);
  assert.equal(updateIngredient(state, "fruit", "onHand", 9).ingredients.find(i => i.id === "fruit")?.onHand, 9);
});


test("full archive is browseable, but example unavailable formats cannot be ordered", async () => {
  const { drinks } = await import("../content/drinks.ts");
  const { demoTradeStatus, demoStatusText } = await import("../content/portal-demo.ts");
  assert.equal(demoProducts.length, drinks.length);
  assert.equal(demoTradeStatus("coconut-horchata","keg"),"unavailable");
  assert.equal(demoTradeStatus("pink-lightning","keg"),"special_order");
  assert.match(demoStatusText("unavailable","keg"),/Unavailable in kegs/);
  assert.deepEqual(sanitizeTradeLines([
    {productId:"coconut-horchata",format:"keg",quantity:3},
    {productId:"coconut-horchata",format:"six_pack",quantity:2},
  ]),[{productId:"coconut-horchata",format:"six_pack",quantity:2}]);
});
