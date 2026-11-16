import {
  demoProducts, type Batch, type BillLine, type DemoState, type FinishedStock,
  type Ingredient, type PackFormat, type RecipeProfile,
} from "../content/portal-demo.ts";

export type ProductionResult = { state: DemoState; error?: string };
const formats: PackFormat[] = ["can", "six_pack", "keg"];
const productIds = new Set(demoProducts.map(x => x.id));
const validDay = (value: string): boolean =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(value + "T12:00:00Z").toISOString().slice(0, 10) === value;
const validSize = (liters: number) => Number.isFinite(liters) && liters > 0 && liters <= 100000;
const round = (value: number) => Math.round(value * 100) / 100;

/** Keep known ingredients with a positive amount, one line each. */
export function cleanBill(state: DemoState, bill: readonly BillLine[]): BillLine[] {
  const lines = new Map<string, number>();
  for (const line of bill) {
    if (!state.ingredients.some(x => x.id === line.ingredientId)) continue;
    if (!Number.isFinite(line.amount) || line.amount <= 0 || line.amount > 100000) continue;
    lines.set(line.ingredientId, round(line.amount));
  }
  return [...lines].map(([ingredientId, amount]) => ({ ingredientId, amount }));
}

export type RecipeInput = { name: string; productId: string; batchLiters: number; bill: BillLine[] };

/** Save a recipe under a name. The same name again updates that recipe. */
export function saveRecipe(state: DemoState, input: RecipeInput, newId: string): ProductionResult {
  const name = input.name.trim().replace(/\s+/g, " ").slice(0, 60);
  if (name.length < 2) return { state, error: "Give the recipe a name." };
  if (!productIds.has(input.productId)) return { state, error: "Choose the drink this recipe makes." };
  if (!validSize(input.batchLiters)) return { state, error: "Enter a batch size above zero." };
  const bill = cleanBill(state, input.bill);
  const existing = state.recipes.find(x => x.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    const updated: RecipeProfile = { ...existing, name, productId: input.productId, batchLiters: input.batchLiters, bill };
    return { state: { ...state, recipes: state.recipes.map(x => x.id === existing.id ? updated : x) } };
  }
  if (!newId || state.recipes.some(x => x.id === newId) || state.recipes.length >= 100)
    return { state, error: "This recipe cannot be added." };
  return { state: { ...state, recipes: [...state.recipes, { id: newId, name, productId: input.productId, batchLiters: input.batchLiters, bill }] } };
}

/** Remove a saved recipe. Batches already scheduled keep their own copy. */
export function deleteRecipe(state: DemoState, id: string): DemoState {
  if (!state.recipes.some(x => x.id === id)) return state;
  return { ...state, recipes: state.recipes.filter(x => x.id !== id),
    batches: state.batches.map(x => x.recipeId === id ? { ...x, recipeId: null } : x) };
}

/** Put a saved recipe on the schedule. The batch gets its own copy of the size and bill. */
export function scheduleBatch(state: DemoState, recipeId: string, date: string, id: string): ProductionResult {
  const recipe = state.recipes.find(x => x.id === recipeId);
  if (!recipe) return { state, error: "Choose a saved recipe." };
  if (!validDay(date)) return { state, error: "Choose a brew date." };
  if (!id || state.batches.some(x => x.id === id) || state.batches.length >= 200) return { state, error: "This batch cannot be added." };
  const batch: Batch = { id, recipeId: recipe.id, name: recipe.name, productId: recipe.productId, date,
    batchLiters: recipe.batchLiters, bill: recipe.bill.map(x => ({ ...x })), status: "planned", notes: "" };
  return { state: { ...state, batches: [...state.batches, batch] } };
}

const editBatch = (state: DemoState, id: string, change: (batch: Batch) => Batch | null): DemoState => {
  const batch = state.batches.find(x => x.id === id);
  if (!batch || batch.status !== "planned") return state;
  const next = change(batch);
  return next ? { ...state, batches: state.batches.map(x => x.id === id ? next : x) } : state;
};

export function updateBatch(state: DemoState, id: string, patch: { date?: string; name?: string; notes?: string }): DemoState {
  return editBatch(state, id, batch => {
    if (patch.date !== undefined && !validDay(patch.date)) return null;
    const name = patch.name === undefined ? batch.name : patch.name.slice(0, 60);
    return { ...batch, ...(patch.date ? { date: patch.date } : {}), name, notes: (patch.notes ?? batch.notes).slice(0, 300) };
  });
}

/** Change a batch's size. With `scale`, every ingredient amount moves in proportion. */
export function resizeBatch(state: DemoState, id: string, liters: number, scale: boolean): DemoState {
  return editBatch(state, id, batch => !validSize(liters) ? null : {
    ...batch, batchLiters: liters,
    bill: scale ? batch.bill.map(x => ({ ...x, amount: round(x.amount * liters / batch.batchLiters) })) : batch.bill,
  });
}

/** Set one ingredient amount on a batch. Zero removes the line. A new ingredient adds one. */
export function setBatchLine(state: DemoState, id: string, ingredientId: string, amount: number): DemoState {
  return editBatch(state, id, batch => {
    if (!state.ingredients.some(x => x.id === ingredientId) || !Number.isFinite(amount) || amount < 0 || amount > 100000) return null;
    const others = batch.bill.filter(x => x.ingredientId !== ingredientId);
    const at = batch.bill.findIndex(x => x.ingredientId === ingredientId);
    if (amount === 0) return { ...batch, bill: others };
    const bill = at < 0 ? [...batch.bill, { ingredientId, amount }] : batch.bill.map(x => x.ingredientId === ingredientId ? { ...x, amount } : x);
    return { ...batch, bill };
  });
}

export function removeBatch(state: DemoState, id: string): DemoState {
  return state.batches.some(x => x.id === id) ? { ...state, batches: state.batches.filter(x => x.id !== id) } : state;
}

/** Save a scheduled batch, as changed, back to a named recipe. */
export function saveBatchAsRecipe(state: DemoState, batchId: string, name: string, newId: string): ProductionResult {
  const batch = state.batches.find(x => x.id === batchId);
  if (!batch) return { state, error: "That batch is gone." };
  return saveRecipe(state, { name, productId: batch.productId, batchLiters: batch.batchLiters, bill: batch.bill }, newId);
}

export type PackCounts = Record<PackFormat, number>;
const validCounts = (counts: PackCounts) =>
  formats.every(f => Number.isSafeInteger(counts[f]) && counts[f] >= 0 && counts[f] <= 100000);

/** Add cans, packs and kegs to packaged stock. Starts a row for a drink that has none. */
export function addFinishedStock(state: DemoState, productId: string, add: PackCounts): ProductionResult {
  if (!productIds.has(productId)) return { state, error: "Choose a drink." };
  if (!validCounts(add) || formats.every(f => add[f] === 0)) return { state, error: "Enter how many cans, packs or kegs to add." };
  const current: FinishedStock = state.finished.find(x => x.productId === productId) ?? { productId, can: 0, six_pack: 0, keg: 0 };
  const next: FinishedStock = { productId, can: current.can + add.can, six_pack: current.six_pack + add.six_pack, keg: current.keg + add.keg };
  if (formats.some(f => next[f] > 100000)) return { state, error: "That is more than this demo can hold." };
  const exists = state.finished.some(x => x.productId === productId);
  return { state: { ...state, finished: exists ? state.finished.map(x => x.productId === productId ? next : x) : [...state.finished, next] } };
}

/** Correct one count. Starts a row for a drink that has none. */
export function setFinishedStock(state: DemoState, productId: string, format: PackFormat, quantity: number): DemoState {
  if (!productIds.has(productId) || !formats.includes(format) || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 100000) return state;
  const current: FinishedStock = state.finished.find(x => x.productId === productId) ?? { productId, can: 0, six_pack: 0, keg: 0 };
  const next = { ...current, [format]: quantity };
  return { ...state, finished: state.finished.some(x => x.productId === productId)
    ? state.finished.map(x => x.productId === productId ? next : x) : [...state.finished, next] };
}

/** Mark a batch packaged and put what came off the line into packaged stock. */
export function packageBatch(state: DemoState, id: string, counts: PackCounts): ProductionResult {
  const batch = state.batches.find(x => x.id === id);
  if (!batch || batch.status !== "planned") return { state, error: "That batch is not waiting to be packaged." };
  const stocked = addFinishedStock(state, batch.productId, counts);
  if (stocked.error) return { state, error: stocked.error };
  return { state: { ...stocked.state, batches: stocked.state.batches.map(x => x.id === id ? { ...x, status: "packaged" as const } : x) } };
}

/** Add an ingredient so recipes can use it. Stock starts at zero. */
export function addIngredient(state: DemoState, name: string, unit: Ingredient["unit"], id: string): ProductionResult {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 60);
  if (clean.length < 2) return { state, error: "Name the ingredient." };
  if (!["kg", "L", "ea"].includes(unit)) return { state, error: "Choose a unit." };
  if (state.ingredients.some(x => x.name.toLowerCase() === clean.toLowerCase())) return { state, error: "That ingredient is already listed." };
  if (!id || state.ingredients.some(x => x.id === id) || state.ingredients.length >= 200) return { state, error: "This ingredient cannot be added." };
  const item: Ingredient = { id, name: clean, unit, onHand: 0, incoming: 0, safety: 0, reorderPoint: 0, leadDays: 7, supplier: "" };
  return { state: { ...state, ingredients: [...state.ingredients, item] } };
}
