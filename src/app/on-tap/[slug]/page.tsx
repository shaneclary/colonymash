import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Confirm } from "@/components/Confirm";
import { DrinkChip } from "@/components/DrinkChip";
import { Photo } from "@/components/Photo";
import { drinks, findDrink, formatAbv, isPouring, seltzerProcess, type Drink } from "@/content/drinks";
import { photos } from "@/content/photos";
import { drinkPath, routes, site } from "@/content/site";
import type { Flavor } from "@/lib/flavors";
import { pageMeta } from "@/lib/seo";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return drinks.map((drink) => ({ slug: drink.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const drink = findDrink(slug);
  if (!drink) return {};
  const kind = drink.kind === "seltzer" ? "a hard seltzer" : drink.style ? `a ${drink.style.toLowerCase()}` : "a beer";
  return pageMeta({
    title: drink.name,
    description: `${drink.name} is ${kind} from ${site.fullName} in Atascadero, ${formatAbv(drink.abv)} ABV.`,
    path: drinkPath(slug),
  });
}

const colorName: Record<Flavor, string> = {
  red: "Red", pink: "Pink", coral: "Coral", orange: "Orange", mango: "Mango gold", yellow: "Yellow",
  lime: "Lime", green: "Green", aqua: "Aqua", blue: "Blue", purple: "Purple", berry: "Deep berry",
  clear: "Cloudy and pale",
};

/** The class that floods the top of the page: a seltzer's color (dashed edges when it is not pouring), or a beer's shade of grey. */
function headClass(drink: Drink): string {
  if (drink.kind === "beer") return drink.shade ? ` cm-shade--${drink.shade}` : "";
  return ` cm-flavor--${drink.flavor}${isPouring(drink) ? "" : " cm-drinkhead--off"}`;
}

export default async function DrinkPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const drink = findDrink(slug);
  if (!drink) notFound();

  const isSeltzer = drink.kind === "seltzer";
  const pouring = isPouring(drink);
  const state = pouring ? "On tap" : drink.kickedAt ? `Kicked ${drink.kickedAt}` : "Not pouring right now";

  return (
    <>
      <section className={`cm-section cm-root cm-drinkhead${headClass(drink)}`}>
        <div className="cm-wrap cm-stack cm-stack--lg cm-stack--fill">
          <div className="cm-section__head">
            <span className="cm-label">{isSeltzer ? "Hard seltzer" : drink.style || "Beer"}</span>
            <span className="cm-mini cm-small">
              <span className={`cm-dot${pouring ? " cm-dot--full" : ""}`} aria-hidden="true" />
              {state}
            </span>
          </div>
          <h1 className={isSeltzer ? "cm-shout-xl" : "cm-sign-xl"}>{drink.name}</h1>
          <p className="cm-data-lg">{formatAbv(drink.abv)} ABV</p>
        </div>
      </section>

      <section data-theme="paper" className="cm-section cm-root">
        <div className="cm-wrap cm-split">
          <div className="cm-stack cm-stack--lg cm-stack--fill">
            {drink.description ? <p className="cm-lede">{drink.description}</p> : null}
            {isSeltzer ? (
              <p className="cm-inline cm-body">
                {seltzerProcess}
                <Confirm id="process" />
              </p>
            ) : null}
            <dl className="cm-facts">
              {drink.kind === "beer" && drink.style ? (
                <>
                  <dt className="cm-label">Style</dt>
                  <dd className="cm-body">{[drink.style, drink.detail].filter(Boolean).join(" · ")}</dd>
                </>
              ) : null}
              <dt className="cm-label">ABV</dt>
              <dd className="cm-data-lg">{formatAbv(drink.abv)}</dd>
              <dt className="cm-label">{isSeltzer ? "Color" : "Shade"}</dt>
              <dd className="cm-inline cm-body">
                <DrinkChip drink={drink} />
                {drink.kind === "seltzer" ? colorName[drink.flavor] : drink.shade ? `${drink.shade} of 6, light to dark` : "Not set yet"}
                <Confirm id="flavors" />
              </dd>
              <dt className="cm-label">Taproom</dt>
              <dd className="cm-body">{state}</dd>
            </dl>
            <div className="cm-actions">
              <Link className="cm-btn cm-btn--primary cm-body-strong" href={routes.onTap}>
                See what&apos;s on tap
              </Link>
              <Link className="cm-btn cm-body-strong" href={isSeltzer ? routes.seltzer : routes.visit}>
                {isSeltzer ? "All seltzers" : "Plan a visit"}
              </Link>
            </div>
          </div>
          <Photo slot={drink.photo ?? (isSeltzer ? photos.seltzerGlass : photos.beerGlass)} />
        </div>
      </section>
    </>
  );
}
