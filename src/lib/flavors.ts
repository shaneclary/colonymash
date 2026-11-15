// The twelve seltzer colors, in wheel order. Names match the cm-flavor-* tokens in design/tokens.json.

export const flavorWheel = [
  "red", "pink", "coral", "orange", "mango", "yellow", "lime", "green", "aqua", "blue", "purple", "berry",
] as const;

export type WheelFlavor = (typeof flavorWheel)[number];

/** "clear" is a seltzer that pours without color. It gets no flavor fill. */
export type Flavor = WheelFlavor | "clear";

/** How dark a beer pours, 1 (pilsner) to 6 (stout). Matches the cm-beer-* tokens. */
export type BeerShade = 1 | 2 | 3 | 4 | 5 | 6;

const deepFlavors: ReadonlySet<string> = new Set(["blue", "purple", "berry"]);

/** Which ink a flavor takes: dark on the nine bright flavors, light on the three deep ones. */
export function inkOnFlavor(flavor: WheelFlavor): "dark" | "light" {
  return deepFlavors.has(flavor) ? "light" : "dark";
}

const wheelPosition = (flavor: Flavor): number => {
  const index = (flavorWheel as readonly string[]).indexOf(flavor);
  return index === -1 ? flavorWheel.length : index;
};

/** Sort comparator: red around to berry, clear pours last. Makes a row of seltzers read as a spectrum. */
export function byFlavorWheel(first: { flavor: Flavor }, second: { flavor: Flavor }): number {
  return wheelPosition(first.flavor) - wheelPosition(second.flavor);
}
