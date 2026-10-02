/** Pantry staples: low stock, inclusion, and the post-cook deduction. Port of mockup `logic.js` + `update-pantry`. */
import { match } from './matching';
import type { DetectedItem, Kitchen, Recipe, Staple, StapleSuggestion } from './types';

/** A staple at or below this many bars counts as running low (the mockup's `lowThreshold`). */
export const LOW_THRESHOLD = 1.5;
export const FULL_LEVEL = 5;

export const isLow = (s: Pick<Staple, 'level'>): boolean => s.level <= LOW_THRESHOLD;
export const lowStaples = (staples: Staple[]): Staple[] => staples.filter(isLow);

// Lives in matching.ts (which needs it) to avoid an import cycle.
export { stapleOn } from './matching';

/** Ingredient id → amount used (recipe unit for staples, base unit for detected items). */
export type UsedAmounts = Record<string, number>;

/** Default "what did you use" amounts for the post-cook pantry update. */
export function defaultUsed(recipe: Recipe, kitchen: Kitchen, servings: number): UsedAmounts {
  const used: UsedAmounts = {};
  for (const row of match(recipe, kitchen, servings).rows) {
    if (row.kind === 'detected' && row.status !== 'missing') {
      used[row.id] = Math.min(row.need, row.have ?? 0);
    }
    if (row.kind === 'staple' && row.status === 'pantry') used[row.id] = row.need;
  }
  return used;
}

export type CookingResult = {
  items: DetectedItem[];
  staples: Staple[];
  /** Ids whose values changed (so callers write only those rows). */
  changedItemIds: string[];
  changedStapleIds: string[];
  /** Staples that weren't low before and are now. */
  newlyLow: Staple[];
};

/**
 * Deducts what was used: detected items lose the amount (base unit); staples lose
 * `qty / perLevel` bars and get `updatedAt` touched. Nothing goes below 0.
 */
export function applyCooking(
  used: UsedAmounts,
  kitchen: Pick<Kitchen, 'items' | 'staples'>,
  nowIso: string,
): CookingResult {
  const wasLow = new Set(lowStaples(kitchen.staples).map((s) => s.id));
  const changedItemIds: string[] = [];
  const changedStapleIds: string[] = [];

  const items = kitchen.items.map((d) => {
    const qty = used[d.id];
    if (qty === undefined) return d;
    changedItemIds.push(d.id);
    return { ...d, value: Math.max(0, Number((d.value - qty).toFixed(2))) };
  });
  const detectedIds = new Set(kitchen.items.map((d) => d.id));

  const staples = kitchen.staples.map((s) => {
    const qty = used[s.id];
    if (qty === undefined || qty <= 0 || detectedIds.has(s.id)) return s;
    changedStapleIds.push(s.id);
    const level = Math.max(0, Number((s.level - qty / s.perLevel).toFixed(2)));
    return { ...s, level, updatedAt: nowIso };
  });

  return {
    items,
    staples,
    changedItemIds,
    changedStapleIds,
    newlyLow: lowStaples(staples).filter((s) => !wasLow.has(s.id)),
  };
}

/** "Garam masala" → "garam_masala" (the mockup's `slug`). */
export const slug = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

/** A staple added from the suggestions list starts as a full new pack. */
export const newStaple = (suggestion: StapleSuggestion, nowIso: string): Staple => ({
  id: slug(suggestion.name),
  name: suggestion.name,
  category: suggestion.category,
  unitHint: 'New pack',
  unit: 'tsp',
  perLevel: 4,
  level: FULL_LEVEL,
  updatedAt: nowIso,
});

/** Level bars are 0-5. */
export const clampLevel = (level: number): number => Math.min(FULL_LEVEL, Math.max(0, level));
