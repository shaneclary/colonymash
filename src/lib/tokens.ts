// Turns design/tokens.json (the style guide's tokens) into CSS custom properties,
// one class per type style, and a font-face per font file.

type ThemedValue = string | Record<string, string>;
type Token = { name: string; value: ThemedValue; usage?: string };
type TokenFamily = { tokens: Token[] };

type TypeStyle = {
  name: string;
  fontSize: string;
  lineHeight?: string | number;
  fontWeight?: string | number;
  letterSpacing?: string;
  family?: string;
};

export type DesignTokens = {
  color: { themes: { id: string; name: string }[]; tokens: Token[] };
  type: {
    fonts: { family: string; file: string; weight: string }[];
    families: Record<string, string>;
    groups: { name: string; family: string; styles: TypeStyle[] }[];
  };
  [family: string]: unknown;
};

const isFamily = (value: unknown): value is TokenFamily =>
  typeof value === "object" && value !== null && Array.isArray((value as TokenFamily).tokens);

const declaration = (name: string, value: string) => `  --${name}: ${value};`;

export function compileTokensCss(tokens: DesignTokens): string {
  const themeIds = tokens.color.themes.map((theme) => theme.id);
  const [firstTheme, ...laterThemes] = themeIds;
  const valueIn = (token: Token, theme: string) =>
    typeof token.value === "string" ? token.value : token.value[theme] ?? token.value[firstTheme];

  const lines: string[] = ["/* Colony Mash: generated from design/tokens.json by `npm run tokens`. Do not edit by hand. */", ""];

  lines.push(`:root, [data-theme="${firstTheme}"] {`);
  for (const token of tokens.color.tokens) lines.push(declaration(token.name, valueIn(token, firstTheme)));
  lines.push("}", "");

  // Later themes redeclare only what changes, so a section can flip its ground with data-theme.
  for (const theme of laterThemes) {
    lines.push(`[data-theme="${theme}"] {`);
    for (const token of tokens.color.tokens) {
      if (typeof token.value !== "string") lines.push(declaration(token.name, valueIn(token, theme)));
    }
    lines.push("}", "");
  }

  lines.push(":root {");
  for (const [familyName, family] of Object.entries(tokens)) {
    if (familyName === "color" || familyName === "type" || !isFamily(family)) continue;
    for (const token of family.tokens) lines.push(declaration(token.name, String(token.value)));
  }
  for (const [key, stack] of Object.entries(tokens.type.families)) lines.push(declaration(`font-${key}`, stack));
  lines.push("}", "");

  for (const group of tokens.type.groups) {
    for (const style of group.styles) {
      const declarations = [`font-family: var(--font-${style.family ?? group.family})`, `font-size: ${style.fontSize}`];
      if (style.lineHeight !== undefined) declarations.push(`line-height: ${style.lineHeight}`);
      if (style.fontWeight !== undefined) declarations.push(`font-weight: ${style.fontWeight}`);
      if (style.letterSpacing !== undefined) declarations.push(`letter-spacing: ${style.letterSpacing}`);
      lines.push(`.${style.name} { ${declarations.join("; ")}; }`);
    }
  }
  lines.push("");

  for (const font of tokens.type.fonts) {
    lines.push(
      `@font-face { font-family: "${font.family}"; src: url("/${font.file}") format("woff2"); font-weight: ${font.weight}; font-display: swap; }`,
    );
  }

  return `${lines.join("\n")}\n`;
}
