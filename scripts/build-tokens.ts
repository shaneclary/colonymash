// Regenerates src/app/tokens.css from design/tokens.json. Run with `npm run tokens`.
import { readFileSync, writeFileSync } from "node:fs";
import { compileTokensCss, type DesignTokens } from "../src/lib/tokens.ts";

const tokensPath = new URL("../design/tokens.json", import.meta.url);
const cssPath = new URL("../src/app/tokens.css", import.meta.url);

const tokens = JSON.parse(readFileSync(tokensPath, "utf8")) as DesignTokens;
writeFileSync(cssPath, compileTokensCss(tokens));
console.log(`Wrote ${cssPath.pathname}`);
