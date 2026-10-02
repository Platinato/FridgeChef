import { createStore } from 'zustand/vanilla';

import { getDb } from '@/db/client';
import { COOKED_LIMIT, cookbookRepo } from '@/db/repositories/cookbookRepo';
import type { Recipe } from '@/domain/types';

import { nowIso, writeThrough } from './persist';

export type CookbookState = {
  hydrated: boolean;
  /** Recipe id → full snapshot, so saved / cooked recipes open offline. */
  snapshots: Record<string, Recipe>;
  /** Saved recipe ids, newest first. */
  saved: string[];
  /** Up to 6 recently cooked recipe ids, newest first. */
  cooked: string[];

  hydrate(): Promise<void>;
  /** Saves (with a snapshot) or unsaves. Check `saved.includes(id)` first for the toast. */
  toggleSave(recipe: Recipe): Promise<boolean>;
  /** Records a cook: moves the recipe to the front of `cooked`. */
  recordCooked(recipe: Recipe, servings: number): Promise<boolean>;
  /** Replaces a stored snapshot with a fresher copy (e.g. from `GET /v1/recipes/{id}`). */
  refreshSnapshot(recipe: Recipe): Promise<boolean>;
};

export const createCookbookStore = () =>
  createStore<CookbookState>()((set, get) => ({
    hydrated: false,
    snapshots: {},
    saved: [],
    cooked: [],

    async hydrate() {
      const rows = await cookbookRepo.load(getDb());
      set({ hydrated: true, ...rows });
    },

    toggleSave(recipe) {
      const { saved, snapshots } = get();
      if (saved.includes(recipe.id)) {
        // Hydrate only loads snapshots that are saved or cooked; drop it here too so memory matches.
        const { [recipe.id]: dropped, ...rest } = snapshots;
        const keep = get().cooked.includes(recipe.id) && dropped;
        set({
          saved: saved.filter((id) => id !== recipe.id),
          snapshots: keep ? snapshots : rest,
        });
        return writeThrough('cookbook.unsave', (db) => cookbookRepo.unsave(db, recipe.id));
      }
      const at = nowIso();
      set({ saved: [recipe.id, ...saved], snapshots: { ...snapshots, [recipe.id]: recipe } });
      return writeThrough('cookbook.save', (db) => cookbookRepo.save(db, recipe, at));
    },

    recordCooked(recipe, servings) {
      const { cooked, snapshots } = get();
      const at = nowIso();
      set({
        cooked: [recipe.id, ...cooked.filter((id) => id !== recipe.id)].slice(0, COOKED_LIMIT),
        snapshots: { ...snapshots, [recipe.id]: recipe },
      });
      return writeThrough('cookbook.cooked', (db) =>
        cookbookRepo.recordCooked(db, recipe, servings, at),
      );
    },

    refreshSnapshot(recipe) {
      if (!get().snapshots[recipe.id]) return Promise.resolve(false);
      set({ snapshots: { ...get().snapshots, [recipe.id]: recipe } });
      return writeThrough('cookbook.snapshot', (db) =>
        cookbookRepo.upsertSnapshot(db, recipe, nowIso()),
      );
    },
  }));
