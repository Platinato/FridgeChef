/** Recipe ingredients vs. the user's confirmed kitchen. Port of mockup `logic.ingredientStatus` / `match`. */
import type {
  IngredientStatus,
  Kitchen,
  MatchResult,
  Recipe,
  RecipeIngredient,
  Staple,
} from './types';

/** Whether a staple counts toward recipes right now. */
export const stapleOn = (s: Staple, pantry: Pick<Kitchen, 'autoInclude' | 'excluded'>): boolean =>
  pantry.autoInclude && !pantry.excluded[s.id] && s.level > 0;

/**
 * One recipe ingredient scaled by `k` (servings ratio) vs. the kitchen:
 * detected items are have / short / missing by amount; staples are pantry / missing;
 * anything else is an extra the user doesn't have.
 */
export function ingredientStatus(
  ing: RecipeIngredient,
  kitchen: Kitchen,
  k: number,
): IngredientStatus {
  const need = ing.qty * k;
  const d = kitchen.items.find((x) => x.id === ing.id);
  if (d) {
    return {
      kind: 'detected',
      name: d.name,
      imageUrl: d.imageUrl,
      need,
      have: d.value,
      status: d.value >= need ? 'have' : d.value > 0 ? 'short' : 'missing',
    };
  }
  const s = kitchen.staples.find((x) => x.id === ing.id);
  if (s)
    return {
      kind: 'staple',
      name: s.name,
      need,
      status: stapleOn(s, kitchen) ? 'pantry' : 'missing',
    };
  return { kind: 'extra', name: ing.name, need, status: 'missing' };
}

/** Match % for a recipe cooked for `servings`: have + pantry rows over all rows. */
export function match(recipe: Recipe, kitchen: Kitchen, servings: number): MatchResult {
  const k = servings / recipe.servings;
  const rows = recipe.ingredients.map((i) => ({ ...i, ...ingredientStatus(i, kitchen, k) }));
  const have = rows.filter((x) => x.status === 'have' || x.status === 'pantry').length;
  const missing = rows.filter((x) => x.status === 'missing' || x.status === 'short');
  const pct = rows.length ? Math.round((have / rows.length) * 100) : 0;
  return { rows, have, total: rows.length, pct, missing };
}
