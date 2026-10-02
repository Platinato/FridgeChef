/**
 * Test-only: the mockup's data as DOMAIN types, read from the mock backend seed modules through
 * the real mappers (so the domain regression tests also pin the seed + mapping). Never imported
 * by app code (architecture-rules test).
 */
import { DEMO_STAPLES, resolveStaples } from '@/db/seeds/demoUser';
import type { AddableItem, DetectedItem, Kitchen, Recipe, Staple } from '@/domain/types';
import { toCatalog, toDetectedItem, toRecipe } from '@/services/api/mappers';
import { catalogSeed } from '@/services/api/mock/db/seed/catalog';
import { detectionSeed } from '@/services/api/mock/db/seed/detections';
import { recipeSeed } from '@/services/api/mock/db/seed/recipes';

/** The 10 mockup recipes, in seed order (ties in sorting keep this order). */
export const MOCKUP_RECIPES: Recipe[] = recipeSeed.map(toRecipe);

/** Everything detection finds, fresh (value = estimate, untouched). */
export const MOCKUP_ITEMS: DetectedItem[] = detectionSeed.map(toDetectedItem);

/** The "Add missed item" quick picks. */
export const MOCKUP_ADDABLE: AddableItem[] = toCatalog(catalogSeed).addableItems;

/** The mockup's detection result for `n` photos (`detectedFor(n)`). */
export const detectedFor = (n: number): DetectedItem[] =>
  MOCKUP_ITEMS.filter((i) => i.photoIndex !== null && i.photoIndex < n).map((i) => ({ ...i }));

export const mockupStaples = (now: number = Date.now()): Staple[] =>
  resolveStaples(DEMO_STAPLES, now);

/** The mockup's seed state as a kitchen: 3 photos' items, all staples, auto-include on. */
export const mockupKitchen = (now: number = Date.now()): Kitchen => ({
  items: detectedFor(3),
  staples: mockupStaples(now),
  autoInclude: true,
  excluded: {},
});

export const recipeById = (id: string): Recipe => {
  const r = MOCKUP_RECIPES.find((x) => x.id === id);
  if (!r) throw new Error(`No mockup recipe ${id}`);
  return r;
};
