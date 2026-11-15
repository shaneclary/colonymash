// Flavor order and which ink goes on which flavor.
import { test } from "node:test";
import assert from "node:assert/strict";
import { byFlavorWheel, flavorWheel, inkOnFlavor } from "./flavors.ts";

test("the wheel has the twelve flavors from the style guide, red around to berry", () => {
  assert.deepEqual(flavorWheel, [
    "red", "pink", "coral", "orange", "mango", "yellow", "lime", "green", "aqua", "blue", "purple", "berry",
  ]);
});

test("byFlavorWheel sorts seltzers into a spectrum, with clear pours last", () => {
  const pours = [{ flavor: "purple" }, { flavor: "clear" }, { flavor: "red" }, { flavor: "green" }, { flavor: "orange" }] as const;
  assert.deepEqual([...pours].sort(byFlavorWheel).map((pour) => pour.flavor), ["red", "orange", "green", "purple", "clear"]);
});

test("only blue, purple and berry take light ink", () => {
  const light = flavorWheel.filter((flavor) => inkOnFlavor(flavor) === "light");
  assert.deepEqual(light, ["blue", "purple", "berry"]);
});
