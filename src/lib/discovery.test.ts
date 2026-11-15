import { test } from "node:test";
import assert from "node:assert/strict";
import { recommendDrinks, validDirection } from "./discovery.ts";
import type { Drink } from "../content/drinks.ts";

const drinks: Drink[] = [
  { kind: "beer", slug: "pilsner", name: "Test Pilsner", style: "German pils", abv: 5, shade: 1, onTap: false },
  { kind: "seltzer", slug: "cherry-limeade", name: "Cherry Limeade", style: "Hard seltzer", abv: 6, flavor: "red", onTap: false },
  { kind: "seltzer", slug: "peach-mango", name: "Peach Mango", style: "Hard seltzer", abv: 6, flavor: "mango", onTap: false },
];

test("discovery matches published name words without adding tasting notes", () => {
  const matches = recommendDrinks(drinks, { category: "all", direction: "tropical" });
  assert.equal(matches[0].drink.slug, "peach-mango");
  assert.equal(matches[0].matched, true);
  assert.equal(matches[0].explanation, "Matched using the release name or listed style.");
});
test("discovery respects category and limits", () => {
  const matches = recommendDrinks(drinks, { category: "beer", direction: "citrus" }, 4);
  assert.equal(matches.length, 1);
  assert.equal(matches[0].drink.kind, "beer");
  assert.equal(matches[0].matched, false);
});
test("invalid saved directions cannot be applied", () => {
  assert.equal(validDirection("tropical"), true);
  assert.equal(validDirection("malicious"), false);
});
