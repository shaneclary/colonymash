import { isPouring, type Drink } from "@/content/drinks";

/**
 * The round chip beside a drink's name. A seltzer's is its color; a beer's is how dark it pours.
 * A drink that is not pouring gets a dashed, empty chip: if it's in color, you can drink it.
 */
export function DrinkChip({ drink }: { drink: Drink }) {
  if (!isPouring(drink)) return <span className="cm-drop cm-drop--off" aria-hidden="true" />;
  const fill = drink.kind === "seltzer" ? drink.flavor : drink.shade ? `b${drink.shade}` : null;
  return <span className={`cm-drop${fill ? ` cm-fill--${fill}` : ""}`} aria-hidden="true" />;
}
