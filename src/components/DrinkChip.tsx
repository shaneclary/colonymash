import { isPouring, tapList, type Drink } from "@/content/drinks";

/**
 * The round chip beside a drink's name. A seltzer's is its color; a beer's is how dark it pours.
 * A seltzer keeps its color when it is not pouring and gets a dashed ring. A beer that is not pouring gets an empty, dashed chip.
 */
export function DrinkChip({ drink }: { drink: Drink }) {
  const pouring = tapList.confirmed && isPouring(drink);
  if (drink.kind === "seltzer") {
    return <span className={`cm-drop cm-fill--${drink.flavor}${pouring ? "" : " cm-drop--rest"}`} aria-hidden="true" />;
  }
  if (!pouring) return <span className="cm-drop cm-drop--off" aria-hidden="true" />;
  return <span className={`cm-drop${drink.shade ? ` cm-fill--b${drink.shade}` : ""}`} aria-hidden="true" />;
}
