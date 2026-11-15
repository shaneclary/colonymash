// Text has to stay readable on every fill. These tests fail if a color in design/tokens.json
// is changed to something its ink can no longer be read on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { contrastRatio, luminance } from "./contrast.ts";
import { flavorWheel, inkOnFlavor } from "./flavors.ts";

type ColorToken = { name: string; value: string | Record<string, string> };
const tokenFile = JSON.parse(readFileSync(new URL("../../design/tokens.json", import.meta.url), "utf8"));
const colorTokens: ColorToken[] = tokenFile.color.tokens;

const colorOf = (name: string, theme = "paper"): string => {
  const token = colorTokens.find((candidate) => candidate.name === name);
  assert.ok(token, `design/tokens.json has no ${name}`);
  return typeof token.value === "string" ? token.value : token.value[theme];
};

const AA_TEXT = 4.5;

test("luminance runs from 0 for black to 1 for white", () => {
  assert.equal(luminance("#000000"), 0);
  assert.ok(Math.abs(luminance("#ffffff") - 1) < 1e-9);
});

test("contrastRatio is 21 for black on white, 1 for a color on itself, and the same either way round", () => {
  assert.ok(Math.abs(contrastRatio("#000000", "#ffffff") - 21) < 1e-9);
  assert.equal(contrastRatio("#ff8a00", "#ff8a00"), 1);
  assert.equal(contrastRatio("#0a0a0a", "#ffd81f"), contrastRatio("#ffd81f", "#0a0a0a"));
});

test("every seltzer color can be read with the ink it takes", () => {
  for (const flavor of flavorWheel) {
    const ink = colorOf(inkOnFlavor(flavor) === "light" ? "cm-on-flavor-light" : "cm-on-flavor-dark");
    const ratio = contrastRatio(colorOf(`cm-flavor-${flavor}`), ink);
    assert.ok(ratio >= AA_TEXT, `${flavor}: ${ratio.toFixed(2)} is under ${AA_TEXT}`);
  }
});

test("the uncolored pour takes dark ink", () => {
  const ratio = contrastRatio(colorOf("cm-flavor-clear"), colorOf("cm-on-flavor-dark"));
  assert.ok(ratio >= AA_TEXT, `clear: ${ratio.toFixed(2)}`);
});

test("beer shades 1 to 3 take dark ink and 4 to 6 take light ink", () => {
  for (const shade of [1, 2, 3, 4, 5, 6]) {
    const ink = colorOf(shade <= 3 ? "cm-on-flavor-dark" : "cm-on-flavor-light");
    const ratio = contrastRatio(colorOf(`cm-beer-${shade}`), ink);
    assert.ok(ratio >= AA_TEXT, `beer shade ${shade}: ${ratio.toFixed(2)} is under ${AA_TEXT}`);
  }
});

test("ink and soft ink can be read on paper and on wash, in both themes", () => {
  for (const theme of ["paper", "ink"]) {
    for (const ground of ["cm-paper", "cm-wash"]) {
      for (const ink of ["cm-ink", "cm-ink-soft"]) {
        const ratio = contrastRatio(colorOf(ground, theme), colorOf(ink, theme));
        assert.ok(ratio >= AA_TEXT, `${ink} on ${ground} (${theme}): ${ratio.toFixed(2)} is under ${AA_TEXT}`);
      }
    }
  }
});
