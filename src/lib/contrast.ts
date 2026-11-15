// WCAG 2 contrast between two "#rrggbb" colors. Used by the tests that guard design/tokens.json.

const channel = (value: number): number => {
  const share = value / 255;
  return share <= 0.04045 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4;
};

/** Relative luminance: 0 for black, 1 for white. */
export function luminance(hex: string): number {
  const digits = hex.replace("#", "");
  const [red, green, blue] = [0, 2, 4].map((start) => parseInt(digits.slice(start, start + 2), 16));
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

/** 1 (no contrast) to 21 (black on white). Body text needs 4.5 or more. */
export function contrastRatio(first: string, second: string): number {
  const [darker, lighter] = [luminance(first), luminance(second)].sort((low, high) => low - high);
  return (lighter + 0.05) / (darker + 0.05);
}
