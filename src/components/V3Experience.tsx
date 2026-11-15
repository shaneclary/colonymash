"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Drink } from "@/content/drinks";
import { drinkPath } from "@/content/site";
import {
  discoveryDirections, profileLabel, recommendDrinks,
  validCategory, validDirection,
  type DiscoveryCategory, type DiscoveryDirection,
} from "@/lib/discovery";

type LabIdea = { id: string; base: string; accent: string };
const storageKey = "colony-mash-v3-exploration";
const spectrum = ["red", "pink", "coral", "orange", "mango", "yellow", "lime", "green", "aqua", "blue", "purple", "berry"] as const;

const fruits = [
  { id: "apricot", label: "Apricot", color: "mango", ink: "dark" },
  { id: "blackberry", label: "Blackberry", color: "berry", ink: "light" },
  { id: "cherry", label: "Cherry", color: "red", ink: "dark" },
  { id: "guava", label: "Guava", color: "pink", ink: "dark" },
  { id: "lime", label: "Lime", color: "lime", ink: "dark" },
  { id: "peach", label: "Peach", color: "orange", ink: "dark" },
] as const;
const accents = ["Basil", "Ginger", "Hibiscus", "Lemon", "Passion fruit", "Vanilla"] as const;

const limits = { favorites: 35, ideas: 8 };
const safeList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string").slice(0, limits.favorites) : [];

function DrinkCard({ drink, saved, onToggle, explanation, index }: {
  drink: Drink;
  saved: boolean;
  onToggle: (slug: string) => void;
  explanation?: string;
  index?: number;
}) {
  const tone = drink.kind === "seltzer" ? "cm-fill--" + drink.flavor : "cm-fill--b" + (drink.shade ?? 3);
  return (
    <article className="v3-release">
      <div className="v3-release__art">
        <div className={"v3-release__color " + tone} aria-hidden="true">
          <span className="v3-release__number">{index === undefined ? "CM" : String(index + 1).padStart(2, "0")}</span>
          <span className="v3-release__type">{drink.kind === "seltzer" ? "CABANA" : "BREWING CO."}</span>
        </div>
      </div>
      <div className="v3-release__body">
        <p className="v3-eyebrow">{drink.kind === "seltzer" ? "HARD SELTZER" : drink.style || "BEER"} · {drink.abv.toFixed(1)}% ABV</p>
        <h3 className="v3-release__name"><Link href={drinkPath(drink.slug)}>{drink.name}</Link></h3>
        {explanation && <p className="v3-release__why">{explanation}</p>}
        <div className="v3-release__actions">
          <button type="button" aria-pressed={saved} className={"v3-save " + (saved ? "v3-save--active" : "")} onClick={() => onToggle(drink.slug)}>
            <span aria-hidden="true">{saved ? "♥" : "♡"}</span> {saved ? "Saved" : "Save"}
          </button>
          <Link href={"/order?drink=" + encodeURIComponent(drink.slug)} className="v3-textlink">Ask about cans / kegs ↗</Link>
        </div>
      </div>
    </article>
  );
}

export function V3Experience({ drinks }: { drinks: Drink[] }) {
  const [direction, setDirection] = useState<DiscoveryDirection>("tropical");
  const [category, setCategory] = useState<DiscoveryCategory>("all");
  const [archiveCategory, setArchiveCategory] = useState<DiscoveryCategory>("all");
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [ideas, setIdeas] = useState<LabIdea[]>([]);
  const [fruit, setFruit] = useState<string>("apricot");
  const [accent, setAccent] = useState<string>("Ginger");
  const [copied, setCopied] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) || "{}");
      if (parsed && typeof parsed === "object") {
        const state = parsed as Record<string, unknown>;
        const known = new Set(drinks.map((drink) => drink.slug));
        setSaved(safeList(state.saved).filter((slug) => known.has(slug)));
        if (validDirection(state.direction)) setDirection(state.direction);
        if (validCategory(state.category)) setCategory(state.category);
        if (Array.isArray(state.ideas)) {
          setIdeas(state.ideas.filter((idea): idea is LabIdea =>
            Boolean(idea && typeof idea === "object" && typeof idea.id === "string" &&
              fruits.some((item) => item.label === idea.base) && accents.some((item) => item === idea.accent))
          .slice(0, limits.ideas));
        }
      }
    } catch { /* no saved browser preferences */ }
    setLoaded(true);
  }, [drinks]);

  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify({ saved, direction, category, ideas })); }
    catch { /* storage can be disabled */ }
  }, [saved, direction, category, ideas, loaded]);

  const matches = useMemo(
    () => recommendDrinks(drinks, { category, direction }, 4),
    [drinks, category, direction],
  );
  const archive = useMemo(() => {
    const term = search.trim().toLowerCase();
    return drinks.filter((drink) =>
      (archiveCategory === "all" || drink.kind === archiveCategory) &&
      (!term || [drink.name, drink.style, drink.detail ?? ""].join(" ").toLowerCase().includes(term)));
  }, [drinks, search, archiveCategory]);
  const favorites = drinks.filter((drink) => saved.includes(drink.slug));
  const chosenFruit = fruits.find((item) => item.id === fruit) ?? fruits[0];

  function toggleSave(slug: string) {
    setSaved((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug].slice(0, limits.favorites));
  }

  function addIdea() {
    const next: LabIdea = { id: String(Date.now()) + "-" + String(ideas.length), base: chosenFruit.label, accent };
    setIdeas((current) => [next, ...current].slice(0, limits.ideas));
  }

  async function copyIdea() {
    try {
      await navigator.clipboard.writeText("Colony Mash Cabana Lab concept (not a real release): " + chosenFruit.label + " + " + accent);
      setCopied("Concept copied. Share it with the crew.");
    } catch { setCopied("Copy unavailable. Your concept is " + chosenFruit.label + " + " + accent + "."); }
  }

  return (
    <div className="v3 cm-root" data-theme="paper">
      <section className="v3-hero" data-theme="ink" aria-labelledby="v3-title">
        <div className="v3-inner v3-hero__grid">
          <div className="v3-hero__copy">
            <p className="v3-kicker"><span className="v3-kicker__square" /> COLONY MASH / A NEW KIND OF TAPROOM / V3</p>
            <h1 id="v3-title" className="v3-hero__title">FIND<br />YOUR<br /><em>COLOR.</em></h1>
            <p className="v3-hero__lede">35 releases. A spectrum of possibility. A brewery you can explore, shape, and make your own.</p>
            <div className="v3-hero__actions">
              <a href="#v3-finder" className="v3-button v3-button--light">Discover your flavor <span aria-hidden="true">↗</span></a>
              <a href="#v3-lab" className="v3-button v3-button--outline-light">Enter the Cabana Lab</a>
            </div>
            <p className="v3-hero__foot">INTERACTIVE CONCEPT PREVIEW · NOT LIVE ORDERING OR NOTIFICATIONS</p>
          </div>
          <div className="v3-hero__art" aria-label="A spectrum of Colony Mash seltzer colors">
            <div className="v3-spectrum" aria-hidden="true">
              {spectrum.map((tone, i) => <span key={tone} className={"v3-spectrum__bar v3-spectrum__bar--" + i + " cm-fill--" + tone} />)}
            </div>
            <div className="v3-hero__roundel" aria-hidden="true">
              <span>THERE'S A</span><strong>WHOLE<br />WORLD</strong><span>IN EVERY COLOR</span>
            </div>
            <div className="v3-hero__art-caption">BEER IN BLACK & WHITE. SELTZER IN COLOR. EVERYTHING ELSE IS DISCOVERY.</div>
          </div>
        </div>
      </section>

      <nav className="v3-subnav" aria-label="V3 preview sections">
        <div className="v3-inner v3-subnav__inner">
          <a href="#v3-finder">01 / FLAVOR DNA</a>
          <a href="#v3-archive">02 / THE ARCHIVE</a>
          <a href="#v3-lab">03 / CABANA LAB</a>
          <a href="#v3-passport">04 / YOUR COLONY</a>
          <a href="#v3-concierge">05 / CANS & KEGS</a>
        </div>
      </nav>

      <section id="v3-finder" className="v3-section v3-finder" aria-labelledby="v3-finder-title">
        <div className="v3-inner">
          <div className="v3-sectionhead">
            <p className="v3-sectionnum">01 / THE FLAVOR DNA PROJECT</p>
            <h2 id="v3-finder-title" className="v3-display">WHAT'S YOUR<br /><span>FLAVOR DNA?</span></h2>
            <p>Skip the guesswork. Tell us what sparks your curiosity and explore releases whose names and listed styles point in that direction.</p>
          </div>
          <div className="v3-finder__layout">
            <div className="v3-finder__questions">
              <p className="v3-question-no">QUESTION 01 <span>YOUR TYPE</span></p>
              <div className="v3-choicegroup" role="group" aria-label="Beverage category">
                {([["all","Both"],["seltzer","Seltzer"],["beer","Beer"]] as const).map(([value,label]) =>
                  <button className={"v3-choice " + (category === value ? "v3-choice--selected" : "")} type="button"
                    key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>)}
              </div>
              <p className="v3-question-no">QUESTION 02 <span>FOLLOW YOUR CURIOSITY</span></p>
              <div className="v3-directions" role="group" aria-label="Flavor interest">
                {discoveryDirections.map((option) => <button type="button" key={option.id} aria-pressed={direction === option.id}
                  className={"v3-direction " + (direction === option.id ? "v3-direction--active" : "")}
                  onClick={() => setDirection(option.id)}>
                  <span className="v3-direction__dot" aria-hidden="true" /><strong>{option.label}</strong><small>{option.hint}</small>
                </button>)}
              </div>
              <p className="v3-disclaimer">Early-stage matching uses names and published beer styles. It does not imply verified ingredients, sweetness, or tasting notes. Erik's approved sensory data will make this much more precise.</p>
            </div>
            <div className="v3-finder__result" aria-live="polite" aria-atomic="true">
              <p className="v3-result__eyebrow">YOUR COLOR CODE <span>CM–03</span></p>
              <div className="v3-result__spectrum" aria-hidden="true">
                {matches.map((match) => <span key={match.drink.slug} className={match.drink.kind === "seltzer" ? "cm-fill--" + match.drink.flavor : "cm-fill--b" + (match.drink.shade ?? 3)} />)}
              </div>
              <p className="v3-result__label">YOU'RE DRAWN TO</p>
              <h3 className="v3-result__title">{profileLabel(direction).toUpperCase()}<br />EXPLORATIONS</h3>
              <p className="v3-result__sub">{category === "all" ? "Beer + seltzer" : category === "beer" ? "Beer" : "Hard seltzer"} · {matches.length} starting points</p>
              <a className="v3-button v3-button--dark" href="#v3-matches">Meet your matches <span aria-hidden="true">↓</span></a>
              <p className="v3-small">Your choices are remembered in this browser only. No account or signup required.</p>
            </div>
          </div>

          <div id="v3-matches" className="v3-matches">
            <div className="v3-rowhead"><h3>YOUR STARTING FOUR</h3><span>NAME / STYLE MATCHES, NOT TASTING CLAIMS</span></div>
            <div className="v3-release-grid">{matches.map((item, i) =>
              <DrinkCard key={item.drink.slug} drink={item.drink} saved={saved.includes(item.drink.slug)} onToggle={toggleSave} index={i} explanation={item.explanation} />)}</div>
          </div>
        </div>
      </section>

      <section id="v3-archive" className="v3-section v3-archive" data-theme="ink" aria-labelledby="v3-archive-title">
        <div className="v3-inner">
          <div className="v3-sectionhead">
            <p className="v3-sectionnum">02 / THE RELEASE ARCHIVE</p>
            <h2 id="v3-archive-title" className="v3-display">THE WHOLE<br /><span>SPECTRUM.</span></h2>
            <p>Every release has a name. Every flavor has a story waiting to be told. Explore the brewery's catalog without confusing historical releases with what's pouring today.</p>
          </div>
          <div className="v3-archive__filters">
            <label htmlFor="v3-search">FIND A RELEASE
              <input id="v3-search" type="search" placeholder="Search 35 releases…" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <div role="group" className="v3-choicegroup" aria-label="Filter archive by type">
              {([["all","All"],["seltzer","Seltzers"],["beer","Beers"]] as const).map(([value,label]) =>
                <button type="button" key={value} className={"v3-choice " + (archiveCategory === value ? "v3-choice--selected" : "")}
                  aria-pressed={archiveCategory === value} onClick={() => setArchiveCategory(value)}>{label}</button>)}
            </div>
            <span className="v3-archive__count" role="status">{archive.length} RELEASES</span>
          </div>
          <div className="v3-release-grid v3-release-grid--archive">{archive.map((drink) =>
            <DrinkCard key={drink.slug} drink={drink} saved={saved.includes(drink.slug)} onToggle={toggleSave} />)}</div>
          {archive.length === 0 && <p className="v3-empty">No match yet. Try a different name or beer style.</p>}
          <div className="v3-note"><strong>THE IMPORTANT DIFFERENCE:</strong> THIS IS A LIBRARY, NOT A CLAIM ABOUT CURRENT TAP OR PACKAGE AVAILABILITY. CHECK <Link href="/on-tap">THE TAPBOARD ↗</Link> FOR THE DRAFT LIST (STILL A SAMPLE UNTIL VERIFIED).</div>
        </div>
      </section>

      <section id="v3-lab" className="v3-section v3-lab" aria-labelledby="v3-lab-title">
        <div className="v3-inner">
          <div className="v3-sectionhead">
            <p className="v3-sectionnum">03 / CABANA LAB</p>
            <h2 id="v3-lab-title" className="v3-display">GOOD IDEAS<br /><span>FERMENT HERE.</span></h2>
            <p>Imagine a community that helps inspire what comes next. Try combining two ingredients, give the concept a look, and save or share the idea. Erik decides what ever makes it into a tank.</p>
          </div>
          <div className="v3-lab__layout">
            <div className="v3-lab__controls">
              <p className="v3-question-no">01 <span>CHOOSE A FRUIT</span></p>
              <div className="v3-lab__buttons" role="group" aria-label="Choose a concept fruit">
                {fruits.map((item) => <button type="button" key={item.id} aria-pressed={fruit === item.id}
                  className={"v3-lab__option " + (fruit === item.id ? "v3-lab__option--active" : "")} onClick={() => setFruit(item.id)}>
                  <span className={"v3-lab__swatch cm-fill--" + item.color} aria-hidden="true" />{item.label}
                </button>)}
              </div>
              <p className="v3-question-no">02 <span>ADD A TWIST</span></p>
              <div className="v3-lab__buttons" role="group" aria-label="Choose a concept accent">
                {accents.map((item) => <button type="button" key={item} aria-pressed={accent === item}
                  className={"v3-lab__option " + (accent === item ? "v3-lab__option--active" : "")} onClick={() => setAccent(item)}>{item}</button>)}
              </div>
              <div className="v3-lab__actionrow">
                <button type="button" onClick={addIdea} className="v3-button v3-button--dark">Save my concept <span aria-hidden="true">＋</span></button>
                <button type="button" onClick={copyIdea} className="v3-button v3-button--ghost">Copy to share ↗</button>
              </div>
              {copied && <p className="v3-feedback" role="status">{copied}</p>}
              <p className="v3-disclaimer">Concepts are fictional. Saving keeps them on this device, not in a public contest or brewery production queue. No vote is submitted.</p>
            </div>
            <div className={"v3-lab__poster cm-fill--" + chosenFruit.color} data-ink={chosenFruit.ink}>
              <div className="v3-lab__posterhead"><span>THE CABANA LAB</span><span>EXPERIMENT / 001</span></div>
              <div className="v3-lab__posterbody">
                <span className="v3-lab__posterbadge">COMMUNITY CONCEPT · NOT A REAL RELEASE</span>
                <strong>{chosenFruit.label.toUpperCase()}<br />+ {accent.toUpperCase()}</strong>
                <span>WHAT WOULD THIS TASTE LIKE?<br />THAT'S THE FUN OF THE EXPERIMENT.</span>
              </div>
              <div className="v3-lab__posterfooter">COLONY MASH / ATASCADERO, CALIFORNIA <span aria-hidden="true">✳</span></div>
            </div>
          </div>
          {ideas.length > 0 && <div className="v3-ideas">
            <div className="v3-rowhead"><h3>YOUR IDEA BOARD</h3><span>SAVED ON THIS DEVICE</span></div>
            <div className="v3-ideas__grid">{ideas.map((idea) => <div key={idea.id} className="v3-idea">
              <span>CONCEPT</span><strong>{idea.base} + {idea.accent}</strong>
              <button type="button" onClick={() => setIdeas((current) => current.filter((entry) => entry.id !== idea.id))}>Remove <span aria-hidden="true">×</span></button>
            </div>)}</div>
          </div>}
        </div>
      </section>

      <section id="v3-passport" className="v3-section v3-passport" data-theme="ink" aria-labelledby="v3-passport-title">
        <div className="v3-inner v3-passport__grid">
          <div className="v3-passport__copy">
            <p className="v3-sectionnum">04 / YOUR PERSONAL COLONY</p>
            <h2 id="v3-passport-title" className="v3-display">KEEP THE<br /><span>GOOD ONES.</span></h2>
            <p>Build a personal archive of releases that interest you. No points for drinking more; this is about remembering discoveries, exploring stories, and following ideas.</p>
            <a href="#v3-archive" className="v3-button v3-button--light">Explore more flavors <span aria-hidden="true">↗</span></a>
          </div>
          <div className="v3-passport__panel">
            <div className="v3-passport__paneltop">
              <span>YOUR FLAVOR PASSPORT</span>
              <strong>{String(favorites.length).padStart(2, "0")}<small> SAVED</small></strong>
            </div>
            {favorites.length === 0 ? <div className="v3-passport__empty">
              <span aria-hidden="true">♡</span><p>No favorites yet. Tap the heart on any release to start your collection.</p>
            </div> : <div className="v3-passport__list">
              {favorites.map((drink) => <div key={drink.slug} className="v3-passport__item">
                <span className={"v3-passport__dot " + (drink.kind === "seltzer" ? "cm-fill--" + drink.flavor : "cm-fill--b" + (drink.shade ?? 3))} aria-hidden="true" />
                <Link href={drinkPath(drink.slug)}>{drink.name}</Link>
                <button type="button" aria-label={"Remove " + drink.name + " from favorites"} onClick={() => toggleSave(drink.slug)}>×</button>
              </div>)}
            </div>}
            <div className="v3-passport__footer">YOUR LIST STAYS IN THIS BROWSER · NO ACCOUNT · NO CONSUMPTION TRACKING</div>
          </div>
        </div>
      </section>

      <section className="v3-section v3-drops" aria-labelledby="v3-drops-title">
        <div className="v3-inner v3-drops__grid">
          <div className="v3-drops__graphic" aria-hidden="true">
            <div className="v3-drops__stripe cm-fill--red" /><div className="v3-drops__stripe cm-fill--mango" />
            <div className="v3-drops__stripe cm-fill--lime" /><div className="v3-drops__stripe cm-fill--blue" />
            <span>WHAT'S<br />NEXT?</span>
          </div>
          <div className="v3-drops__copy">
            <p className="v3-sectionnum">05 / RELEASE RADAR</p>
            <h2 id="v3-drops-title" className="v3-display">NEXT UP?<br /><span>STAY CURIOUS.</span></h2>
            <p>No release calendar or product drop is confirmed yet. In the finished experience, you could follow a saved flavor, see upcoming batches, and opt in to verified availability alerts.</p>
            <div className="v3-statusbar"><span className="v3-statusbar__dot" /> NO VERIFIED UPCOMING RELEASE DATES</div>
            <Link href="/updates" className="v3-button v3-button--dark">See updates preview <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section id="v3-concierge" className="v3-section v3-concierge" data-theme="ink" aria-labelledby="v3-concierge-title">
        <div className="v3-inner">
          <p className="v3-sectionnum">06 / FROM THE TAP TO YOUR PEOPLE</p>
          <div className="v3-concierge__grid">
            <div>
              <h2 id="v3-concierge-title" className="v3-display">CANS.<br />KEGS.<br /><span>GOOD COMPANY.</span></h2>
              <p>The beautiful discovery experience should lead somewhere useful. Put together a cans or kegs request and let the brewery confirm what's actually available.</p>
              <Link href="/order" className="v3-button v3-button--light">Build a cans & kegs request <span aria-hidden="true">↗</span></Link>
            </div>
            <div className="v3-concierge__terms">
              <p>PROPOSED DELIVERY TERMS / ERIK TO CONFIRM</p>
              <div><strong>03+</strong><span>KEGS / SLO COUNTY DELIVERY PROPOSAL</span></div>
              <div><strong>05+</strong><span>KEGS / UP TO 150 MILES DELIVERY PROPOSAL</span></div>
              <p className="v3-concierge__fine">No live pricing, checkout, delivery authorization or inventory sync. Current ordering is an email inquiry. Distance, fees, legality and keg sizes require owner confirmation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="v3-outro" aria-label="V3 review status">
        <div className="v3-inner v3-outro__inner">
          <span>COLONY MASH / V3 EXPERIENCE PREVIEW</span>
          <strong>SMALL BATCH.<br />WIDE OPEN.</strong>
          <p>Designed for exploration. Ready to grow with the brewery.</p>
          <div><Link href="/">← Return to current website</Link><Link href="/confirm">Erik's confirmation checklist ↗</Link></div>
        </div>
      </section>
    </div>
  );
}
