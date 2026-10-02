/** Which recipes fit, and in what order. Port of mockup `logic.passes` / `score` / `suggestions`. */
import { match } from './matching';
import type {
  DietPref,
  EffortPref,
  FilterId,
  Kitchen,
  MatchResult,
  Preferences,
  Recipe,
  RecipeDiet,
  SortId,
  Suggestion,
} from './types';

/** Highest recipe effort (1-5) each effort preference allows. */
export const EFFORT_MAX: Record<EffortPref, number> = { minimal: 2, moderate: 3, chef: 5 };

const ANY_DIET: RecipeDiet[] = ['nonveg', 'egg', 'veg', 'vegan'];

/** Recipe diets each diet preference allows. Keto / high-protein are goals (scored), not filters. */
export const DIET_OK: Record<DietPref, RecipeDiet[]> = {
  none: ANY_DIET,
  keto: ANY_DIET,
  protein: ANY_DIET,
  veg: ['veg', 'vegan'],
  jain: ['veg', 'vegan'],
  vegan: ['vegan'],
  egg: ['egg', 'veg', 'vegan'],
};

/** Allergy → ingredient ids it rules out. */
export const ALLERGENS: Record<string, string[]> = {
  Dairy: ['paneer', 'yogurt', 'milk', 'cream', 'butter', 'ghee', 'cheese'],
  Eggs: ['eggs'],
  Gluten: ['pasta', 'bread', 'tortilla', 'atta', 'maida'],
  Soy: ['soy_sauce'],
  Nuts: [],
  Shellfish: [],
};

/** Hard filters: time, effort, equipment, diet, cuisine, allergies. */
export function passes(recipe: Recipe, prefs: Preferences, allergies: string[]): boolean {
  if (recipe.timeMin > prefs.timeMin || recipe.effort > EFFORT_MAX[prefs.effort]) return false;
  if (!recipe.equipment.every((e) => prefs.equipment.includes(e))) return false;
  if (!(DIET_OK[prefs.diet] ?? ANY_DIET).includes(recipe.diet)) return false;
  if (!prefs.cuisines.includes('Any') && !prefs.cuisines.includes(recipe.cuisine)) return false;
  const banned = allergies.flatMap((a) => ALLERGENS[a] ?? []);
  return !recipe.ingredients.some((i) => banned.includes(i.id));
}

/** "Best match" = how much you already have, nudged by mood, hunger, spice and diet goals. */
export function score(recipe: Recipe, m: MatchResult, prefs: Preferences): number {
  const n = recipe.nutrition;
  let s = m.pct;
  if (recipe.moods.includes(prefs.mood)) s += 15;
  if (prefs.hunger === 'snack' && n.kcal < 420) s += 8;
  if (prefs.hunger === 'starving' && n.kcal >= 500) s += 8;
  if (Math.abs(recipe.spice - prefs.spice) <= 1) s += 5;
  if (prefs.diet === 'protein' && n.protein >= 25) s += 10;
  if (prefs.diet === 'keto' && n.carbs <= 20) s += 10;
  return s;
}

/** Suggestions filter chips. */
export const FILTERS: Record<FilterId, (recipe: Recipe, m: MatchResult) => boolean> = {
  all: () => true,
  everything: (_r, m) => m.pct === 100,
  quick: (r) => r.timeMin <= 20,
  onepan: (r) => r.onePan,
  protein: (r) => r.nutrition.protein >= 25,
};

/** Suggestions sort orders. Array sort is stable, so ties keep the input order. */
export const SORTS: Record<SortId, (a: Suggestion, b: Suggestion) => number> = {
  best: (a, b) => b.score - a.score,
  quick: (a, b) => a.recipe.timeMin - b.recipe.timeMin,
  effort: (a, b) => a.recipe.effort - b.recipe.effort,
  protein: (a, b) => b.recipe.nutrition.protein - a.recipe.nutrition.protein,
};

export type SuggestionContext = { kitchen: Kitchen; prefs: Preferences; allergies: string[] };

/** Filter by preferences, match against the kitchen, apply the chip, then sort. */
export function rankSuggestions(recipes: Recipe[], ctx: SuggestionContext): Suggestion[] {
  const { kitchen, prefs, allergies } = ctx;
  return recipes
    .filter((r) => passes(r, prefs, allergies))
    .map((r) => {
      const m = match(r, kitchen, prefs.servings);
      return { recipe: r, match: m, score: score(r, m, prefs) };
    })
    .filter((x) => FILTERS[prefs.filter](x.recipe, x.match))
    .sort(SORTS[prefs.sort]);
}
