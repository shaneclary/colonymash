// tokens.css is generated from design/tokens.json. This fails if someone edits one without the other.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileTokensCss, type DesignTokens } from "./tokens.ts";

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), "utf8");
const tokens = JSON.parse(read("../../design/tokens.json")) as DesignTokens;
const compiled = compileTokensCss(tokens);

test("src/app/tokens.css matches design/tokens.json (run `npm run tokens` after changing the JSON)", () => {
  assert.equal(read("../app/tokens.css"), compiled);
});

test("the first theme is the default and the second is opt-in by data-theme", () => {
  assert.match(compiled, /:root, \[data-theme="paper"\] \{[^}]*--cm-ink: #0a0a0a;/);
  assert.match(compiled, /\[data-theme="ink"\] \{[^}]*--cm-ink: #ffffff;/);
});

test("flavors are the same in both themes, so they are declared once", () => {
  assert.equal(compiled.match(/--cm-flavor-red:/g)?.length, 1);
});

test("spacing, radius, stroke and size tokens and the font stacks are on :root", () => {
  for (const name of ["--cm-space-4: 16px;", "--cm-radius-0: 0px;", "--cm-rule: 2px;", "--cm-tap-min: 48px;", "--font-cm-mono:"]) {
    assert.ok(compiled.includes(name), name);
  }
});

test("every type style becomes a class and every font file a font-face", () => {
  assert.match(compiled, /\.cm-sign-xl \{ font-family: var\(--font-cm-display\); font-size: 80px; line-height: 0\.9; font-weight: 900; letter-spacing: -0\.01em; \}/);
  assert.match(compiled, /@font-face \{ font-family: "Mona Sans"; src: url\("\/fonts\/MonaSans-Variable\.woff2"\) format\("woff2"\); font-weight: 200 900; font-display: swap; \}/);
});
