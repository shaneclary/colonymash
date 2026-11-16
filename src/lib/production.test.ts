import { test } from "node:test";
import assert from "node:assert/strict";
import { demoSeed } from "../content/portal-demo.ts";
import {
  addFinishedStock, addIngredient, deleteRecipe, packageBatch, removeBatch, resizeBatch, saveBatchAsRecipe,
  saveRecipe, scheduleBatch, setBatchLine, setFinishedStock, updateBatch,
} from "./production.ts";
import { finishedUnitAvailability, ingredientForecast, productionEstimates } from "./portal-forecast.ts";

const today = "2026-11-15";
const seed = demoSeed(new Date("2026-11-15T12:00:00"));
const none = { can: 0, six_pack: 0, keg: 0 };

test("a recipe saves under a name with its own size and amounts", () => {
  const saved = saveRecipe(seed, { name: "  Kiwi  Canoe pilot ", productId: "kiwi-canoe", batchLiters: 350,
    bill: [{ ingredientId: "base", amount: 40 }, { ingredientId: "fruit", amount: 22.456 }, { ingredientId: "nope", amount: 3 }, { ingredientId: "co2", amount: 0 }] }, "R-1");
  assert.equal(saved.error, undefined);
  assert.deepEqual(saved.state.recipes.at(-1), { id: "R-1", name: "Kiwi Canoe pilot", productId: "kiwi-canoe", batchLiters: 350,
    bill: [{ ingredientId: "base", amount: 40 }, { ingredientId: "fruit", amount: 22.46 }] });
  assert.equal(saved.state.recipes.length, seed.recipes.length + 1);
});

test("saving the same name again updates that recipe instead of adding one", () => {
  const first = saveRecipe(seed, { name: "House seltzer", productId: "cherry-limeade", batchLiters: 200, bill: [] }, "R-1").state;
  const second = saveRecipe(first, { name: "house SELTZER", productId: "cherry-limeade", batchLiters: 400, bill: [{ ingredientId: "base", amount: 50 }] }, "R-2").state;
  assert.equal(second.recipes.length, first.recipes.length);
  assert.equal(second.recipes.find(x => x.id === "R-1")?.batchLiters, 400);
  assert.equal(second.recipes.some(x => x.id === "R-2"), false);
});

test("a recipe needs a name, a drink and a size", () => {
  const base = { name: "Test", productId: "cherry-limeade", batchLiters: 200, bill: [] };
  assert.ok(saveRecipe(seed, { ...base, name: " " }, "R").error);
  assert.ok(saveRecipe(seed, { ...base, productId: "not-a-drink" }, "R").error);
  assert.ok(saveRecipe(seed, { ...base, batchLiters: 0 }, "R").error);
  assert.equal(saveRecipe(seed, { ...base, batchLiters: -5 }, "R").state, seed);
});

test("scheduling a recipe copies it, and the batch can change without touching the recipe", () => {
  const scheduled = scheduleBatch(seed, "demo-cherry", "2026-11-25", "B-9").state;
  const batch = scheduled.batches.find(x => x.id === "B-9");
  assert.ok(batch);
  assert.deepEqual([batch.name, batch.batchLiters, batch.status, batch.date], ["Cherry Limeade (sample)", 200, "planned", "2026-11-25"]);
  let changed = setBatchLine(scheduled, "B-9", "fruit", 20);
  changed = setBatchLine(changed, "B-9", "berry", 3);     // add an ingredient
  changed = setBatchLine(changed, "B-9", "nutrient", 0);  // remove one
  const bill = changed.batches.find(x => x.id === "B-9")?.bill;
  assert.deepEqual(bill, [{ ingredientId: "base", amount: 25 }, { ingredientId: "fruit", amount: 20 }, { ingredientId: "co2", amount: 2 }, { ingredientId: "berry", amount: 3 }]);
  assert.deepEqual(changed.recipes, seed.recipes);
  assert.equal(setBatchLine(scheduled, "B-9", "nope", 2), scheduled);
  assert.equal(setBatchLine(scheduled, "B-9", "fruit", -1), scheduled);
  assert.ok(scheduleBatch(seed, "missing", "2026-11-25", "B-9").error);
  assert.ok(scheduleBatch(seed, "demo-cherry", "tomorrow", "B-9").error);
  assert.ok(scheduleBatch(scheduled, "demo-cherry", "2026-11-25", "B-9").error);
});

test("batch size can change alone or scale the ingredient amounts with it", () => {
  const scheduled = scheduleBatch(seed, "demo-cherry", "2026-11-25", "B-9").state;
  const alone = resizeBatch(scheduled, "B-9", 300, false).batches.find(x => x.id === "B-9");
  assert.deepEqual([alone?.batchLiters, alone?.bill[1].amount], [300, 14]);
  const scaled = resizeBatch(scheduled, "B-9", 300, true).batches.find(x => x.id === "B-9");
  assert.deepEqual(scaled?.bill.map(x => x.amount), [37.5, 21, 1.5, 3]);
  assert.equal(resizeBatch(scheduled, "B-9", 0, true), scheduled);
});

test("a changed batch can be saved back as a new named recipe", () => {
  let state = scheduleBatch(seed, "demo-cherry", "2026-11-25", "B-9").state;
  state = resizeBatch(state, "B-9", 400, true);
  const saved = saveBatchAsRecipe(state, "B-9", "Cherry Limeade double", "R-2");
  assert.equal(saved.error, undefined);
  assert.deepEqual(saved.state.recipes.at(-1)?.bill.map(x => x.amount), [50, 28, 2, 4]);
  assert.equal(saved.state.recipes.at(-1)?.batchLiters, 400);
});

test("batch date and notes edit; removing a recipe leaves scheduled batches alone", () => {
  const moved = updateBatch(seed, "DEMO-B1", { date: "2026-12-01", notes: "Moved for the holiday." });
  assert.deepEqual([moved.batches[0].date, moved.batches[0].notes], ["2026-12-01", "Moved for the holiday."]);
  assert.equal(updateBatch(seed, "DEMO-B1", { date: "soon" }), seed);
  const gone = deleteRecipe(seed, "demo-cherry");
  assert.equal(gone.recipes.length, seed.recipes.length - 1);
  assert.equal(gone.batches.length, seed.batches.length);
  assert.equal(gone.batches[0].recipeId, null);
  assert.equal(removeBatch(seed, "DEMO-B1").batches.length, seed.batches.length - 1);
  assert.equal(removeBatch(seed, "missing"), seed);
});

test("ingredient need follows each batch's own amounts", () => {
  const need = (state: typeof seed, id: string) => ingredientForecast(state, today).find(x => x.item.id === id)?.required;
  // Seed: two cherry batches at 14 L of fruit each.
  assert.equal(need(seed, "fruit"), 28);
  assert.equal(need(setBatchLine(seed, "DEMO-B1", "fruit", 20), "fruit"), 34);
  assert.equal(need(removeBatch(seed, "DEMO-B1"), "fruit"), 14);
  assert.equal(productionEstimates(seed).find(x => x.productId === "cherry-limeade")?.plannedLiters, 400);
});

test("cans, packs and kegs can be added for any drink", () => {
  const added = addFinishedStock(seed, "cherry-limeade", { can: 48, six_pack: 10, keg: 2 }).state;
  assert.deepEqual(added.finished.find(x => x.productId === "cherry-limeade"), { productId: "cherry-limeade", can: 66, six_pack: 19, keg: 3 });
  // A drink with no stock row yet gets one.
  assert.equal(seed.finished.some(x => x.productId === "kiwi-canoe"), false);
  const fresh = addFinishedStock(seed, "kiwi-canoe", { ...none, six_pack: 12 }).state;
  assert.equal(finishedUnitAvailability(fresh, "kiwi-canoe", "six_pack").stock, 12);
  assert.ok(addFinishedStock(seed, "kiwi-canoe", none).error);
  assert.ok(addFinishedStock(seed, "kiwi-canoe", { ...none, can: -1 }).error);
  assert.ok(addFinishedStock(seed, "not-a-drink", { ...none, can: 1 }).error);
  assert.equal(setFinishedStock(seed, "kiwi-canoe", "keg", 4).finished.find(x => x.productId === "kiwi-canoe")?.keg, 4);
  assert.equal(setFinishedStock(seed, "kiwi-canoe", "keg", 1.5), seed);
});

test("packaging a batch closes it and stocks what came off the line", () => {
  const packaged = packageBatch(seed, "DEMO-B1", { can: 0, six_pack: 40, keg: 2 });
  assert.equal(packaged.error, undefined);
  assert.equal(packaged.state.batches.find(x => x.id === "DEMO-B1")?.status, "packaged");
  assert.equal(finishedUnitAvailability(packaged.state, "cherry-limeade", "six_pack").stock, 49);
  assert.equal(productionEstimates(packaged.state).find(x => x.productId === "cherry-limeade")?.plannedLiters, 200);
  assert.ok(packageBatch(packaged.state, "DEMO-B1", { ...none, keg: 1 }).error);
  assert.ok(packageBatch(seed, "DEMO-B1", none).error);
  assert.equal(setBatchLine(packaged.state, "DEMO-B1", "fruit", 99), packaged.state); // closed batches do not change
});

test("a new ingredient can be added once and used in a recipe", () => {
  const added = addIngredient(seed, "Kiwi puree", "L", "ING-1");
  assert.equal(added.error, undefined);
  assert.equal(added.state.ingredients.at(-1)?.onHand, 0);
  assert.ok(addIngredient(added.state, "kiwi PUREE", "L", "ING-2").error);
  assert.ok(addIngredient(seed, " ", "L", "ING-1").error);
  const used = saveRecipe(added.state, { name: "Kiwi", productId: "kiwi-canoe", batchLiters: 200, bill: [{ ingredientId: "ING-1", amount: 18 }] }, "R-1");
  assert.deepEqual(used.state.recipes.at(-1)?.bill, [{ ingredientId: "ING-1", amount: 18 }]);
});
