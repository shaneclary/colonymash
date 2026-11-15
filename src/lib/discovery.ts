import type { Drink } from "../content/drinks.ts";

/**
 * V3 discovery is deliberately explainable. These keywords come ONLY from
 * published beverage names / stated beer styles, NOT inferred tasting notes.
 * When Erik approves proper ingredient + tasting metadata, replace this rule
 * matcher with a verified product-attribute matcher.
 */
export const discoveryDirections = [
  { id: "citrus", label: "Citrus", hint: "Lime · lemon · orange" },
  { id: "berry", label: "Berry", hint: "Cherry · raspberry · berry" },
  { id: "tropical", label: "Tropical", hint: "Peach · guava · coconut" },
  { id: "comfort", label: "Soft & rich", hint: "Vanilla · coffee · stout" },
  { id: "hoppy", label: "Hoppy styles", hint: "IPA · pale ale" },
  { id: "crisp", label: "Crisp styles", hint: "Pils · lager · kölsch" },
  { id: "wildcard", label: "Surprise me", hint: "Explore the whole archive" },
] as const;

export type DiscoveryDirection = (typeof discoveryDirections)[number]["id"];
export type DiscoveryCategory = "all" | "seltzer" | "beer";
export type DiscoveryProfile = { direction: DiscoveryDirection; category: DiscoveryCategory };

const keywords: Record<Exclude<DiscoveryDirection, "wildcard">, RegExp> = {
  citrus: /\b(lime|limeade|lemon|lemonade|orange|paloma|mule)\b/i,
  berry: /\b(cherry|strawberry|raspberry|boysenberry|berry|razz|purple|rose|pink)\b/i,
  tropical: /\b(peach|mango|guava|coconut|pina|colada|pog|kiwi|painkiller|cabana)\b/i,
  comfort: /\b(creamsicle|vanilla|horchata|coffee|pourover|porter|stout)\b/i,
  hoppy: /\b(ipa|pale ale)\b/i,
  crisp: /\b(pils|pilsner|lager|kölsch|kolsch)\b/i,
};

export type DiscoveryMatch = {
  drink: Drink;
  matched: boolean;
  explanation: string;
};

export function recommendDrinks(
  drinks: readonly Drink[],
  profile: DiscoveryProfile,
  limit = 4,
): DiscoveryMatch[] {
  const filtered = drinks.filter((drink) => profile.category === "all" || drink.kind === profile.category);
  const scored = filtered.map((drink, index) => {
    const declared = [drink.name, drink.style, drink.detail ?? ""].join(" ");
    const matched = profile.direction !== "wildcard" && keywords[profile.direction].test(declared);
    return { drink, matched, index };
  });
  scored.sort((a, b) => Number(b.matched) - Number(a.matched) || a.index - b.index);
  return scored.slice(0, Math.max(0, Math.min(12, limit))).map(({ drink, matched }) => ({
    drink,
    matched,
    explanation: matched
      ? "Matched using the release name or listed style."
      : "Another release to explore from the catalog.",
  }));
}

export function profileLabel(direction: DiscoveryDirection): string {
  return discoveryDirections.find((item) => item.id === direction)?.label ?? "Explore";
}

export function validDirection(value: unknown): value is DiscoveryDirection {
  return discoveryDirections.some((item) => item.id === value);
}

export function validCategory(value: unknown): value is DiscoveryCategory {
  return value === "all" || value === "seltzer" || value === "beer";
}
