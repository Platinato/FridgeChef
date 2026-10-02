/** Preference defaults and the Mood / Suggestions preference rules. Port of mockup `app.js` actions. */
import type { Preferences, Profile } from './types';

export const DEFAULT_PROFILE: Profile = {
  name: '',
  diet: 'none',
  allergies: [],
  householdSize: 2,
  units: 'metric',
  defaultEffort: 'moderate',
};

export const DEFAULT_PREFERENCES: Preferences = {
  mood: 'comfort',
  timeMin: 45,
  effort: 'moderate',
  servings: 2,
  hunger: 'meal',
  cuisines: ['Any'],
  diet: 'none',
  equipment: ['stove', 'microwave', 'pressure', 'blender'],
  spice: 3,
  filter: 'all',
  sort: 'best',
};

export const MAX_TIME_MIN = 120;
export const ADD_TIME_MIN = 30;

/** "Any" is exclusive: picking it clears the rest; clearing the last cuisine falls back to "Any". */
export function toggleCuisine(cuisines: string[], value: string): string[] {
  const picked = cuisines.filter((x) => x !== 'Any');
  const next =
    value === 'Any'
      ? []
      : picked.includes(value)
        ? picked.filter((x) => x !== value)
        : picked.concat(value);
  return next.length ? next : ['Any'];
}

/** Adds or removes a value (equipment, allergies). */
export const toggleIn = (list: string[], value: string): string[] =>
  list.includes(value) ? list.filter((x) => x !== value) : list.concat(value);

/** "Loosen filters" on an empty Suggestions list. */
export const loosen = (prefs: Preferences): Preferences => ({
  ...prefs,
  filter: 'all',
  cuisines: ['Any'],
  effort: 'chef',
});

/** "+30 min" on an empty Suggestions list, capped at 2 hours. */
export const addTime = (prefs: Preferences): Preferences => ({
  ...prefs,
  timeMin: Math.min(MAX_TIME_MIN, prefs.timeMin + ADD_TIME_MIN),
});
