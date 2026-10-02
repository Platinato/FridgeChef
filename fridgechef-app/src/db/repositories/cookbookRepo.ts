/** Saved recipes and cooked history, backed by full recipe snapshots (so they work offline). */
import { z } from 'zod';

import type { Recipe } from '@/domain/types';

import type { SqlDriver } from '../driver';
import { jsonColumn, parseRow, recipeSchema } from './rows';

/** The cooked list shows this many recent, distinct recipes (the mockup's `slice(0, 6)`). */
export const COOKED_LIMIT = 6;

const snapshotRow = z.object({ id: z.string(), recipe: jsonColumn(recipeSchema) });
const idRow = z.object({ recipe_id: z.string() });

export type CookbookRows = {
  /** Recipe id → snapshot, for every saved or cooked recipe. */
  snapshots: Record<string, Recipe>;
  /** Newest first. */
  saved: string[];
  /** Up to 6 distinct recipes, most recently cooked first. */
  cooked: string[];
};

export type CookedEntry = { recipeId: string; servings: number; cookedAt: string };

async function upsertSnapshot(db: SqlDriver, recipe: Recipe, fetchedAt: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO recipe_snapshots (id, recipe, fetched_at) VALUES (?, ?, ?)
     ON CONFLICT (id) DO UPDATE SET recipe = excluded.recipe, fetched_at = excluded.fetched_at`,
    [recipe.id, JSON.stringify(recipe), fetchedAt],
  );
}

export const cookbookRepo = {
  async load(db: SqlDriver): Promise<CookbookRows> {
    const [snapshots, saved, cooked] = await Promise.all([
      db.getAllAsync<unknown>(
        `SELECT id, recipe FROM recipe_snapshots
         WHERE id IN (SELECT recipe_id FROM saved_recipes UNION SELECT recipe_id FROM cooked_history)`,
      ),
      db.getAllAsync<unknown>(
        'SELECT recipe_id FROM saved_recipes ORDER BY saved_at DESC, rowid DESC',
      ),
      db.getAllAsync<unknown>(
        `SELECT recipe_id FROM cooked_history GROUP BY recipe_id
         ORDER BY MAX(cooked_at) DESC, MAX(id) DESC LIMIT ?`,
        [COOKED_LIMIT],
      ),
    ]);
    const byId: Record<string, Recipe> = {};
    for (const row of snapshots) {
      const s = parseRow(snapshotRow, row, 'recipe_snapshots');
      byId[s.id] = s.recipe;
    }
    return {
      snapshots: byId,
      saved: saved.map((r) => parseRow(idRow, r, 'saved_recipes').recipe_id),
      cooked: cooked.map((r) => parseRow(idRow, r, 'cooked_history').recipe_id),
    };
  },

  /** Refreshes a snapshot (e.g. after `GET /v1/recipes/{id}`). */
  upsertSnapshot,

  /** Saves a recipe: stores its snapshot and marks it saved (one transaction). */
  async save(db: SqlDriver, recipe: Recipe, savedAt: string): Promise<void> {
    await db.withTransactionAsync(async () => {
      await upsertSnapshot(db, recipe, savedAt);
      await db.runAsync(
        `INSERT INTO saved_recipes (recipe_id, saved_at) VALUES (?, ?)
         ON CONFLICT (recipe_id) DO UPDATE SET saved_at = excluded.saved_at`,
        [recipe.id, savedAt],
      );
    });
  },

  /** Unsaves a recipe. The snapshot stays (it may be in the cooked history). */
  async unsave(db: SqlDriver, recipeId: string): Promise<void> {
    await db.runAsync('DELETE FROM saved_recipes WHERE recipe_id = ?', [recipeId]);
  },

  /** Adds a cooked-history entry with the recipe's snapshot (one transaction). */
  async recordCooked(
    db: SqlDriver,
    recipe: Recipe,
    servings: number,
    cookedAt: string,
  ): Promise<void> {
    await db.withTransactionAsync(async () => {
      await upsertSnapshot(db, recipe, cookedAt);
      await db.runAsync(
        'INSERT INTO cooked_history (recipe_id, servings, cooked_at) VALUES (?, ?, ?)',
        [recipe.id, servings, cookedAt],
      );
    });
  },

  /** Every cook, newest first (the store only keeps the recent distinct ids). */
  async history(db: SqlDriver): Promise<CookedEntry[]> {
    const rows = await db.getAllAsync<unknown>(
      'SELECT recipe_id, servings, cooked_at FROM cooked_history ORDER BY cooked_at DESC, id DESC',
    );
    const entry = z
      .object({
        recipe_id: z.string(),
        servings: z.number().int().positive(),
        cooked_at: z.string(),
      })
      .transform((r): CookedEntry => ({
        recipeId: r.recipe_id,
        servings: r.servings,
        cookedAt: r.cooked_at,
      }));
    return rows.map((r) => parseRow(entry, r, 'cooked_history'));
  },
};
