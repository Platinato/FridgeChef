import { createStore } from 'zustand/vanilla';

import { getDb } from '@/db/client';
import { prefsRepo } from '@/db/repositories';
import {
  DEFAULT_PREFERENCES,
  addTime,
  loosen,
  toggleCuisine,
  toggleIn,
} from '@/domain/preferences';
import type { DietPref, EffortPref, FilterId, Hunger, Preferences, SortId } from '@/domain/types';

import { nowIso, writeThrough } from './persist';

/** The preferences are flat on the store: `usePrefsStore((s) => s.mood)`. */
export type PrefsState = Preferences & {
  hydrated: boolean;

  hydrate(): Promise<void>;
  /** Sets any preferences and writes the row. The named actions below are built on it. */
  update(patch: Partial<Preferences>): Promise<boolean>;
  setMood(mood: string): Promise<boolean>;
  setTimeMin(minutes: number): Promise<boolean>;
  setEffort(effort: EffortPref): Promise<boolean>;
  setServings(servings: number): Promise<boolean>;
  setHunger(hunger: Hunger): Promise<boolean>;
  /** "Any" is exclusive (see `domain/preferences.toggleCuisine`). */
  toggleCuisine(cuisine: string): Promise<boolean>;
  setDiet(diet: DietPref): Promise<boolean>;
  toggleEquipment(id: string): Promise<boolean>;
  setSpice(spice: number): Promise<boolean>;
  setFilter(filter: FilterId): Promise<boolean>;
  setSort(sort: SortId): Promise<boolean>;
  /** Empty Suggestions → "Loosen filters": all chips, any cuisine, chef effort. */
  loosenFilters(): Promise<boolean>;
  /** Empty Suggestions → "+30 min" (max 120). */
  addTime(): Promise<boolean>;
};

const KEYS = Object.keys(DEFAULT_PREFERENCES) as (keyof Preferences)[];

/** Just the persisted preferences, without actions or flags. */
export const selectPreferences = (s: Preferences): Preferences =>
  Object.fromEntries(KEYS.map((k) => [k, s[k]])) as Preferences;

export const createPrefsStore = () =>
  createStore<PrefsState>()((set, get) => {
    const update = (patch: Partial<Preferences>) => {
      const next = { ...selectPreferences(get()), ...patch };
      set(patch);
      return writeThrough('prefs.save', (db) => prefsRepo.save(db, next, nowIso()));
    };
    const current = () => selectPreferences(get());

    return {
      ...DEFAULT_PREFERENCES,
      hydrated: false,

      async hydrate() {
        const prefs = await prefsRepo.get(getDb());
        set({ ...(prefs ?? DEFAULT_PREFERENCES), hydrated: true });
      },

      update,
      setMood: (mood) => update({ mood }),
      setTimeMin: (timeMin) => update({ timeMin }),
      setEffort: (effort) => update({ effort }),
      setServings: (servings) => update({ servings }),
      setHunger: (hunger) => update({ hunger }),
      toggleCuisine: (cuisine) => update({ cuisines: toggleCuisine(get().cuisines, cuisine) }),
      setDiet: (diet) => update({ diet }),
      toggleEquipment: (id) => update({ equipment: toggleIn(get().equipment, id) }),
      setSpice: (spice) => update({ spice }),
      setFilter: (filter) => update({ filter }),
      setSort: (sort) => update({ sort }),
      loosenFilters: () => update(loosen(current())),
      addTime: () => update(addTime(current())),
    };
  });
