"use client";

import { useState, type FormEvent } from "react";
import { demoProducts, type Batch, type BillLine, type DemoState, type Ingredient } from "@/content/portal-demo";
import { productionEstimates } from "@/lib/portal-forecast";
import {
  deleteRecipe, packageBatch, removeBatch, resizeBatch, saveBatchAsRecipe, saveRecipe, scheduleBatch,
  setBatchLine, updateBatch, type PackCounts, type RecipeInput,
} from "@/lib/production";
import { barrels, dayDate, liters, newId, productName, type PanelProps } from "../format";
import { PackFields } from "./StockPanel";

const positive = (text: string) => { const n = Number(text); return text.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null; };
const zero: PackCounts = { can: 0, six_pack: 0, keg: 0 };
const blankRecipe = (): RecipeInput => ({ name: "", productId: demoProducts[0]?.id ?? "", batchLiters: 200, bill: [] });

/** Ingredient amounts for one batch or recipe, with a row to add another ingredient. */
function BillEditor({ bill, ingredients, onSet, idPrefix }: {
  bill: BillLine[]; ingredients: Ingredient[]; onSet: (ingredientId: string, amount: number) => void; idPrefix: string;
}) {
  const unused = ingredients.filter(x => !bill.some(line => line.ingredientId === x.id));
  const [pick, setPick] = useState("");
  const [pickAmount, setPickAmount] = useState("1");
  const chosen = unused.some(x => x.id === pick) ? pick : unused[0]?.id ?? "";
  return <div className="cm-portal__bill-edit">
    {bill.length === 0 && <p className="cm-portal__muted">No ingredients yet.</p>}
    {bill.map(line => {
      const item = ingredients.find(x => x.id === line.ingredientId);
      return <div className="cm-portal__bill-row" key={line.ingredientId}>
        <label htmlFor={idPrefix + line.ingredientId}>{item?.name ?? line.ingredientId}</label>
        <input id={idPrefix + line.ingredientId} type="number" inputMode="decimal" min={0} max={100000} step={0.1} value={line.amount}
          onChange={e => { const n = positive(e.target.value); if (n !== null && n > 0) onSet(line.ingredientId, n); }}/>
        <span>{item?.unit}</span>
        <button type="button" className="cm-portal__button" aria-label={"Remove " + (item?.name ?? "ingredient")} onClick={() => onSet(line.ingredientId, 0)}>×</button>
      </div>;
    })}
    {unused.length > 0 && <div className="cm-portal__bill-row cm-portal__bill-row--add">
      <select aria-label="Ingredient to add" value={chosen} onChange={e => setPick(e.target.value)}>
        {unused.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <input type="number" inputMode="decimal" aria-label="Amount to add" min={0} step={0.1} value={pickAmount} onChange={e => setPickAmount(e.target.value)}/>
      <span>{ingredients.find(x => x.id === chosen)?.unit}</span>
      <button type="button" className="cm-portal__button" onClick={() => { const n = positive(pickAmount); if (chosen && n) onSet(chosen, n); }}>Add</button>
    </div>}
  </div>;
}

function BatchCard({ batch, state, commit, run, today }: PanelProps & { batch: Batch }) {
  const [scale, setScale] = useState(true);
  const [saveName, setSaveName] = useState(batch.name);
  const [packing, setPacking] = useState(false);
  const [counts, setCounts] = useState<PackCounts>(zero);
  const label = batch.name + " (" + dayDate(batch.date) + ")";
  return <article className="cm-portal__order">
    <div className="cm-portal__order-top"><div><span className="cm-portal__overline">{dayDate(batch.date)} · {productName(batch.productId)}{batch.date < today ? " · past its date" : ""}</span>
      <h3>{batch.name}</h3></div><span className="cm-portal__status cm-portal__status--scheduled">{liters(batch.batchLiters)}</span></div>
    <div className="cm-portal__pair">
      <label>Brew date<input type="date" value={batch.date} onChange={e => commit("Moved " + batch.name, s => updateBatch(s, batch.id, { date: e.target.value }))}/></label>
      <label>Batch size (L)<input type="number" inputMode="decimal" min={1} max={100000} step={1} value={batch.batchLiters}
        onChange={e => { const n = positive(e.target.value); if (n) commit("Resized " + label, s => resizeBatch(s, batch.id, n, scale)); }}/>
        <small>{barrels(batch.batchLiters)}</small></label>
    </div>
    <label className="cm-portal__check"><input type="checkbox" checked={scale} onChange={e => setScale(e.target.checked)}/> Scale the ingredients when the size changes</label>
    <h4>Ingredients for this batch</h4>
    <BillEditor bill={batch.bill} ingredients={state.ingredients} idPrefix={batch.id + "-"}
      onSet={(ingredientId, value) => commit("Changed ingredients on " + label, s => setBatchLine(s, batch.id, ingredientId, value))}/>
    <label className="cm-portal__stack">Notes<input type="text" maxLength={300} value={batch.notes} onChange={e => commit("Edited notes on " + label, s => updateBatch(s, batch.id, { notes: e.target.value }))}/></label>
    {packing && <form className="cm-portal__form cm-portal__subform" onSubmit={event => {
      event.preventDefault();
      if (run("Packaged " + label, s => packageBatch(s, batch.id, counts))) setPacking(false);
    }}>
      <strong>What came off the line?</strong>
      <PackFields value={counts} onChange={setCounts} idPrefix={batch.id + "-pack-"}/>
      <div className="cm-portal__order-actions"><button type="submit" className="cm-portal__button cm-portal__button--dark">Package and add to stock</button>
        <button type="button" className="cm-portal__button" onClick={() => setPacking(false)}>Not yet</button></div>
    </form>}
    <div className="cm-portal__order-actions">
      {!packing && <button type="button" className="cm-portal__button cm-portal__button--dark" onClick={() => setPacking(true)}>Package this batch</button>}
      <button type="button" className="cm-portal__button" onClick={() => commit("Removed batch " + label, s => removeBatch(s, batch.id))}>Remove</button>
    </div>
    <form className="cm-portal__inline-form" onSubmit={event => { event.preventDefault(); run("Saved recipe: " + saveName.trim(), s => saveBatchAsRecipe(s, batch.id, saveName, newId("RCP"))); }}>
      <label>Save this batch as a recipe named<input type="text" required maxLength={60} value={saveName} onChange={e => setSaveName(e.target.value)}/></label>
      <button type="submit" className="cm-portal__button">Save recipe</button>
    </form>
  </article>;
}

function RecipeEditor({ state, run, commit }: Pick<PanelProps, "state" | "run" | "commit">) {
  const [draft, setDraft] = useState<RecipeInput>(blankRecipe);
  const [loadedId, setLoadedId] = useState("");
  const setLine = (ingredientId: string, value: number) => setDraft(current => {
    const others = current.bill.filter(x => x.ingredientId !== ingredientId);
    if (value === 0) return { ...current, bill: others };
    return { ...current, bill: current.bill.some(x => x.ingredientId === ingredientId)
      ? current.bill.map(x => x.ingredientId === ingredientId ? { ...x, amount: value } : x) : [...current.bill, { ingredientId, amount: value }] };
  });
  function load(id: string) {
    setLoadedId(id);
    const recipe = state.recipes.find(x => x.id === id);
    setDraft(recipe ? { name: recipe.name, productId: recipe.productId, batchLiters: recipe.batchLiters, bill: recipe.bill.map(x => ({ ...x })) } : blankRecipe());
  }
  const nameTaken = state.recipes.some(x => x.name.toLowerCase() === draft.name.trim().toLowerCase());
  return <section className="cm-portal__panel" data-tour="recipes">
    <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Recipe profiles</p><h2>Save a recipe to reuse</h2></div><span>{state.recipes.length} saved</span></div>
    <form className="cm-portal__form" onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); run("Saved recipe: " + draft.name.trim(), s => saveRecipe(s, draft, newId("RCP"))); }}>
      <label htmlFor="recipe-load">Start from
        <select id="recipe-load" value={loadedId} onChange={e => load(e.target.value)}>
          <option value="">A blank recipe</option>{state.recipes.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label htmlFor="recipe-name">Recipe name<input id="recipe-name" type="text" required maxLength={60} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label>
      <label htmlFor="recipe-product">Makes
        <select id="recipe-product" value={draft.productId} onChange={e => setDraft({ ...draft, productId: e.target.value })}>
          {demoProducts.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label htmlFor="recipe-size">Batch size (L)<input id="recipe-size" type="number" inputMode="decimal" min={1} max={100000} step={1} value={draft.batchLiters}
        onChange={e => { const n = positive(e.target.value); if (n) setDraft({ ...draft, batchLiters: n }); }}/><small>{barrels(draft.batchLiters)}</small></label>
      <strong>Ingredients per batch</strong>
      <BillEditor bill={draft.bill} ingredients={state.ingredients} idPrefix="recipe-" onSet={setLine}/>
      <div className="cm-portal__order-actions">
        <button type="submit" className="cm-portal__button cm-portal__button--dark">{nameTaken ? "Update “" + draft.name.trim() + "”" : "Save as a new recipe"}</button>
        {loadedId && <button type="button" className="cm-portal__button" onClick={() => { commit("Deleted recipe: " + draft.name, s => deleteRecipe(s, loadedId)); load(""); }}>Delete this recipe</button>}
      </div>
      <p className="cm-portal__muted">Saving under a name that exists updates that recipe. A new name makes a new one. Batches already on the schedule keep their own amounts.</p>
    </form>
  </section>;
}

/** Production: the batch schedule, each batch's size and ingredients, and saved recipe profiles. */
export function ProductionPanel(props: PanelProps) {
  const { state, run, today, live } = props;
  const [recipeId, setRecipeId] = useState("");
  const [date, setDate] = useState(today);
  const chosen = state.recipes.some(x => x.id === recipeId) ? recipeId : state.recipes[0]?.id ?? "";
  const planned = state.batches.filter(x => x.status === "planned").sort((a, b) => a.date.localeCompare(b.date));
  const packaged = state.batches.filter(x => x.status === "packaged");
  const short = productionEstimates(state as DemoState).filter(x => x.extraBatches > 0);
  return <>
    <section className="cm-portal__panel" data-tour="batches">
      <div className="cm-portal__panel-head"><div><p className="cm-portal__overline">Production</p><h2>Batch schedule</h2></div>
        <span>{planned.length} planned · {packaged.length} packaged</span></div>
      <form className="cm-portal__inline-form" onSubmit={event => { event.preventDefault(); run("Scheduled a batch", s => scheduleBatch(s, chosen, date, newId("B"))); }}>
        <label>Recipe<select value={chosen} onChange={e => setRecipeId(e.target.value)}>
          {state.recipes.length === 0 && <option value="">Save a recipe first</option>}
          {state.recipes.map(x => <option key={x.id} value={x.id}>{x.name} · {liters(x.batchLiters)}</option>)}</select></label>
        <label>Brew date<input type="date" required value={date} onChange={e => setDate(e.target.value)}/></label>
        <button type="submit" disabled={!chosen} className="cm-portal__button cm-portal__button--dark">Add to schedule</button>
      </form>
      <p className="cm-portal__muted">Adding a batch copies the recipe. Change the size or any amount on the batch and the saved recipe stays as it was.</p>
      {short.map(x => <p className="cm-portal__feedback" key={x.productId}>Committed orders need {x.extraBatches} more {x.extraBatches === 1 ? "batch" : "batches"} of {x.productName} than the schedule holds.</p>)}
      {planned.length === 0 && <p className="cm-portal__muted">Nothing on the schedule.</p>}
      <div className="cm-portal__orderlist">{planned.map(batch => <BatchCard key={batch.id} batch={batch} {...props}/>)}</div>
      {!live && <p className="cm-portal__muted">All amounts here are invented samples. Erik's real recipes replace them.</p>}
    </section>
    <RecipeEditor state={state} run={run} commit={props.commit}/>
  </>;
}
