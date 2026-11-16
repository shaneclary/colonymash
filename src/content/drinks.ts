// Every beer and seltzer. The tap list, the strip under the header, the flight and the drink pages read this file.
// Names and ABVs are from the brewery's public TapHunter listing (35 drinks, read Nov 15, 2026).
// Which twelve are pouring is a sample until the brewery supplies its real list or a feed.
import { byFlavorWheel, type BeerShade, type Flavor } from "../lib/flavors.ts";
import { photos, type PhotoSlot } from "./photos.ts";

type DrinkBase = {
  slug: string;
  name: string;
  /** As the listing gives it. Empty when the listing gives none. */
  style: string;
  abv: number;
  /** One short extra fact for the style line: "Joebella coffee", "nitro". */
  detail?: string;
  /** One or two true sentences for the drink's page. */
  description?: string;
  /** Owner-approved sensory and production notes; do not infer from the name. */
  tasting?: { aroma?: string; palate?: string; finish?: string; };
  ingredients?: string[];
  brewerNote?: string;
  /** This drink's own photo. Without one, its page shows the standard slot for a beer or a seltzer. */
  photo?: PhotoSlot;
  onTap: boolean;
  isNew?: boolean;
  lastKeg?: boolean;
  /** Set when a keg empties during service, e.g. "3:40 PM". The row loses its color until it is cleared. */
  kickedAt?: string;
};

/** Beer is described in black and white, by how dark it pours. No shade means we do not know yet. */
export type Beer = DrinkBase & { kind: "beer"; shade?: BeerShade };

/** Seltzer is described in color. The flavor is one of the twelve tokens, or "clear" for a pour with no fruit color. */
export type Seltzer = DrinkBase & { kind: "seltzer"; flavor: Flavor };

export type Drink = Beer | Seltzer;

/** Where the tap list came from. `confirmed` flips to true when the brewery supplies the real one. */
export const tapList = {
  confirmed: false,
  /** Shown beside the title until `updated` is set. */
  sampleNote: "Sample rows from public listings",
  /** Once live: when the list last changed, as the visitor should read it. "Updated today 3:02 PM". */
  updated: null as string | null,
};

/** The name the seltzers are listed under on Untappd. Used as a group heading only. See the "seltzer-line" question. */
export const seltzerLine = "Colony Cabana";

/** How the seltzers are made, as described in 2020. See the "process" question. */
export const seltzerProcess = "Fermented on fruit. Never back-sweetened. Bone dry.";

const beers: Beer[] = [
  {
    kind: "beer", slug: "postconventional-pilsner", name: "Postconventional Pilsner", style: "German pils", abv: 5.0, shade: 1, onTap: true,
    description: "The first beer in the tanks, back in 2020, and still one of the brewer's favorites.",
    photo: photos.pilsnerCans,
  },
  { kind: "beer", slug: "loral-blanc", name: "Loral Blanc", style: "Kölsch", abv: 5.0, shade: 1, onTap: true },
  { kind: "beer", slug: "lucky-loral", name: "Lucky Loral", style: "Kölsch", abv: 5.0, shade: 1, onTap: false },
  { kind: "beer", slug: "rickys-rice-lager", name: "Ricky's Rice Lager", style: "Pale lager", abv: 4.8, shade: 1, onTap: true },
  { kind: "beer", slug: "kiwi-canoe", name: "Kiwi Canoe", style: "American pale ale", abv: 5.7, shade: 2, onTap: false },
  { kind: "beer", slug: "the-nap", name: "The N.A.P.", style: "American pale ale", abv: 4.9, shade: 2, onTap: false },
  { kind: "beer", slug: "neon-skyline", name: "Neon Skyline", style: "American IPA", abv: 6.3, shade: 2, onTap: true },
  { kind: "beer", slug: "super-soft-birthday", name: "Super Soft Birthday", style: "American IPA", abv: 6.5, shade: 2, onTap: false },
  { kind: "beer", slug: "willard", name: "Willard", style: "Red IPA", abv: 6.2, shade: 3, onTap: true },
  { kind: "beer", slug: "stone-cold-steve-owlstin", name: "Stone Cold Steve Owlstin", style: "Amber lager", abv: 6.2, shade: 3, onTap: false },
  { kind: "beer", slug: "dos-calaveras", name: "Dos Calaveras", style: "", abv: 6.3, onTap: false },
  {
    kind: "beer", slug: "baltic-pourover", name: "Baltic Pourover", style: "Baltic porter", abv: 6.0, shade: 5, onTap: true,
    detail: "Joebella coffee",
    description: "A porter made with coffee from Joebella Coffee, next door.",
  },
  { kind: "beer", slug: "no-reflections", name: "No Reflections", style: "American stout", abv: 6.0, shade: 6, onTap: true },
  { kind: "beer", slug: "mexican-imperial-stout", name: "Mexican Imperial Stout", style: "Imperial stout", abv: 10.5, shade: 6, onTap: false },
];

// Which seltzer gets which color is proposed from the names, not checked against the glass.
// The colors themselves were tuned to the brewery's photos. See the "flavors" question.
const seltzers: Seltzer[] = [
  { kind: "seltzer", slug: "cherry-limeade", name: "Cherry Limeade", style: "Hard seltzer", abv: 6.0, flavor: "red", onTap: true },
  { kind: "seltzer", slug: "strawberry-rhubarb", name: "Strawberry Rhubarb", style: "Hard seltzer", abv: 6.0, flavor: "red", onTap: false },
  { kind: "seltzer", slug: "pink-lightning", name: "Pink Lightning", style: "Hard seltzer", abv: 6.0, flavor: "pink", onTap: false },
  { kind: "seltzer", slug: "raspberry-guava", name: "Raspberry Guava", style: "Hard seltzer", abv: 6.0, flavor: "pink", onTap: false },
  { kind: "seltzer", slug: "cabana-punch", name: "Cabana Punch", style: "Hard seltzer", abv: 7.5, flavor: "pink", onTap: false },
  { kind: "seltzer", slug: "paloma", name: "Paloma", style: "Hard seltzer", abv: 6.0, flavor: "coral", onTap: false },
  { kind: "seltzer", slug: "rose-in-the-garden", name: "Rose in the Garden", style: "Hard seltzer", abv: 6.0, flavor: "coral", onTap: false },
  { kind: "seltzer", slug: "rose-in-the-grove", name: "Rose in the Grove", style: "Hard seltzer", abv: 6.0, flavor: "coral", onTap: false },
  { kind: "seltzer", slug: "orange-creamsicle", name: "Orange Creamsicle", style: "Hard seltzer", abv: 6.0, flavor: "orange", onTap: true },
  { kind: "seltzer", slug: "pog", name: "P.O.G.", style: "Hard seltzer", abv: 8.0, flavor: "orange", onTap: false },
  { kind: "seltzer", slug: "peach-mango", name: "Peach Mango", style: "Hard seltzer", abv: 6.0, flavor: "mango", onTap: false },
  { kind: "seltzer", slug: "painkiller", name: "Painkiller", style: "Hard seltzer", abv: 8.5, flavor: "mango", onTap: false },
  { kind: "seltzer", slug: "lemonade", name: "Lemonade", style: "Hard seltzer", abv: 6.0, flavor: "yellow", onTap: false },
  { kind: "seltzer", slug: "sicilian-lemonade", name: "Sicilian Lemonade", style: "Hard seltzer", abv: 6.0, flavor: "yellow", onTap: false },
  { kind: "seltzer", slug: "pina-colada", name: "Pina Colada", style: "Hard seltzer", abv: 8.0, flavor: "yellow", onTap: false },
  { kind: "seltzer", slug: "atascabama-mule", name: "Atascabama Mule", style: "Hard seltzer", abv: 6.0, flavor: "lime", onTap: false },
  { kind: "seltzer", slug: "melon-mirage", name: "Melon Mirage", style: "Hard seltzer", abv: 6.0, flavor: "green", onTap: true },
  { kind: "seltzer", slug: "slo-blue-razz", name: "Slo Blue Razz", style: "Hard seltzer", abv: 6.0, flavor: "blue", onTap: true },
  { kind: "seltzer", slug: "purple-reign", name: "Purple Reign", style: "Hard seltzer", abv: 6.0, flavor: "purple", onTap: true },
  { kind: "seltzer", slug: "boysenberry-vanilla", name: "Boysenberry Vanilla", style: "Hard seltzer", abv: 6.0, flavor: "berry", onTap: false },
  { kind: "seltzer", slug: "coconut-horchata", name: "Coconut Horchata", style: "Hard seltzer", abv: 6.0, flavor: "clear", onTap: false },
];

/** Beers light to dark, unshaded last. Seltzers red around to berry, clear last. */
const byShade = (first: Beer, second: Beer) => (first.shade ?? 7) - (second.shade ?? 7);

export const allBeers: Beer[] = [...beers].sort(byShade);
export const allSeltzers: Seltzer[] = [...seltzers].sort(byFlavorWheel);
export const drinks: Drink[] = [...allBeers, ...allSeltzers];

/** "Pouring" means on the list and not kicked. A pouring drink gets a full dot and a solid edge. */
export const isPouring = (drink: Drink) => drink.onTap && !drink.kickedAt;

export const beersOnTap = allBeers.filter(isPouring);
export const seltzersOnTap = allSeltzers.filter(isPouring);
export const seltzersPouring = seltzersOnTap.filter(isPouring);
export const drinksOnTap: Drink[] = [...beersOnTap, ...seltzersOnTap];

export const findDrink = (slug: string) => drinks.find((drink) => drink.slug === slug);

/** "6.0%": ABV always to one decimal. */
export const formatAbv = (abv: number) => `${abv.toFixed(1)}%`;
