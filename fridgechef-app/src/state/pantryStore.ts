import { createStore } from 'zustand/vanilla';

import { getDb } from '@/db/client';
import { DEFAULT_STAPLE_LEVEL } from '@/db/bootstrap';
import { metaRepo, pantryRepo, scanRepo } from '@/db/repositories';
import { FULL_LEVEL, applyCooking, clampLevel, newStaple, type UsedAmounts } from '@/domain/pantry';
import type { DefaultStaple, Staple, StapleSuggestion } from '@/domain/types';

import { nowIso, writeThrough } from './persist';
import type { AppStores } from './types';

export type PantryState = {
  hydrated: boolean;
  staples: Staple[];
  /** Include remembered staples in every scan. */
  autoInclude: boolean;
  /** Staple id → true when switched off on the Confirm screen. */
  excluded: Record<string, boolean>;

  hydrate(): Promise<void>;
  /** Sets the bars (0-5) and touches `updatedAt`. */
  setLevel(id: string, level: number): Promise<boolean>;
  /** "Mark as refilled": full, updated now. */
  refill(id: string): Promise<boolean>;
  remove(id: string): Promise<boolean>;
  /** Adds a suggested staple as a full new pack. Resolves false if it's already in the pantry. */
  add(suggestion: StapleSuggestion): Promise<boolean>;
  toggleIncluded(id: string): Promise<boolean>;
  setAutoInclude(on: boolean): Promise<boolean>;
  /**
   * Once per install: if the pantry is empty when the catalog first loads (http mode starts
   * empty), add the catalog's default staples at 3 bars. Resolves how many were added.
   */
  applyDefaultStaples(defaults: DefaultStaple[]): Promise<number>;
  /**
   * Post-cook update: deducts `used` from the scan's items and the staples in one transaction.
   * Resolves with the staples that just became low (for "N items running low").
   */
  applyCooking(used: UsedAmounts): Promise<{ newlyLow: Staple[]; saved: boolean }>;
};

export const createPantryStore = (app: () => AppStores) =>
  createStore<PantryState>()((set, get) => {
    const patchStaple = (id: string, patch: Partial<Staple>) => {
      const staple = get().staples.find((s) => s.id === id);
      if (!staple) return Promise.resolve(false);
      const next = { ...staple, ...patch };
      set({ staples: get().staples.map((s) => (s.id === id ? next : s)) });
      return writeThrough('pantry.level', (db) => pantryRepo.saveLevels(db, [next]));
    };

    return {
      hydrated: false,
      staples: [],
      autoInclude: true,
      excluded: {},

      async hydrate() {
        const db = getDb();
        const [{ staples, excluded }, autoInclude] = await Promise.all([
          pantryRepo.list(db),
          metaRepo.getAutoInclude(db),
        ]);
        set({ hydrated: true, staples, excluded, autoInclude });
      },

      setLevel: (id, level) => patchStaple(id, { level: clampLevel(level), updatedAt: nowIso() }),
      refill: (id) => patchStaple(id, { level: FULL_LEVEL, updatedAt: nowIso() }),

      remove(id) {
        const { [id]: _dropped, ...excluded } = get().excluded;
        set({ staples: get().staples.filter((s) => s.id !== id), excluded });
        return writeThrough('pantry.remove', (db) => pantryRepo.remove(db, id));
      },

      add(suggestion) {
        const staple = newStaple(suggestion, nowIso());
        if (get().staples.some((s) => s.id === staple.id)) return Promise.resolve(false);
        set({ staples: [...get().staples, staple] });
        return writeThrough('pantry.add', (db) => pantryRepo.add(db, staple));
      },

      toggleIncluded(id) {
        const excluded = { ...get().excluded };
        if (excluded[id]) delete excluded[id];
        else excluded[id] = true;
        set({ excluded });
        return writeThrough('pantry.included', (db) =>
          pantryRepo.setIncluded(db, id, !excluded[id]),
        );
      },

      setAutoInclude(on) {
        set({ autoInclude: on });
        return writeThrough('pantry.autoInclude', (db) => metaRepo.setAutoInclude(db, on));
      },

      async applyDefaultStaples(defaults) {
        let added: Staple[] = [];
        await writeThrough('pantry.defaultStaples', async (db) => {
          if (await metaRepo.getDefaultStaplesChecked(db)) return;
          if (get().staples.length === 0 && defaults.length > 0) {
            const at = nowIso();
            added = defaults.map((s) => ({ ...s, level: DEFAULT_STAPLE_LEVEL, updatedAt: at }));
            await db.withTransactionAsync(async () => {
              for (const s of added) await pantryRepo.add(db, s);
            });
            set({ staples: [...get().staples, ...added] });
          }
          await metaRepo.setDefaultStaplesChecked(db);
        });
        return added.length;
      },

      async applyCooking(used) {
        const scan = app().scan;
        const { items, sessionId } = scan.getState();
        const result = applyCooking(used, { items, staples: get().staples }, nowIso());
        set({ staples: result.staples });
        scan.setState({ items: result.items });

        const staples = result.staples.filter((s) => result.changedStapleIds.includes(s.id));
        const changedItems = result.items.filter((d) => result.changedItemIds.includes(d.id));
        const saved = await writeThrough('pantry.applyCooking', (db) =>
          db.withTransactionAsync(async () => {
            await pantryRepo.saveLevels(db, staples);
            if (sessionId && changedItems.length) {
              await scanRepo.updateItems(db, sessionId, changedItems);
            }
          }),
        );
        return { newlyLow: result.newlyLow, saved };
      },
    };
  });
