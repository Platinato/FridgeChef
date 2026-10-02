import { MOCKUP_RECIPES, detectedFor, mockupKitchen, recipeById } from '@/testing/mockupData';
import { match } from '@/domain/matching';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import { FILTERS, SORTS, passes, rankSuggestions, score } from '@/domain/suggestions';
import type { Preferences } from '@/domain/types';

const NOW = Date.parse('2026-09-29T09:00:00Z');
const kitchen = mockupKitchen(NOW);

const ids = (prefs: Partial<Preferences> = {}, allergies: string[] = []) =>
  rankSuggestions(MOCKUP_RECIPES, {
    kitchen,
    prefs: { ...DEFAULT_PREFERENCES, ...prefs },
    allergies,
  }).map((s) => s.recipe.id);

describe('rankSuggestions (mockup-verified counts)', () => {
  it('default seed + default prefs → 9 suggestions in best-match order', () => {
    expect(ids()).toEqual([
      'palak-paneer',
      'egg-fried-rice',
      'curd-rice',
      'butter-chicken',
      'shakshuka',
      'paneer-bhurji',
      'masala-omelette',
      'tomato-pasta',
      'tikka-wrap',
    ]);
  });

  it('time 15 → 4', () => {
    expect(ids({ timeMin: 15 })).toEqual([
      'egg-fried-rice',
      'curd-rice',
      'paneer-bhurji',
      'masala-omelette',
    ]);
  });

  it('vegetarian → 4', () => {
    expect(ids({ diet: 'veg' })).toHaveLength(4);
    expect(ids({ diet: 'veg' })).toEqual(
      expect.arrayContaining(['palak-paneer', 'curd-rice', 'paneer-bhurji', 'tomato-pasta']),
    );
  });

  it('Dairy allergy → 2', () => {
    expect(ids({}, ['Dairy'])).toEqual(['egg-fried-rice', 'shakshuka']);
  });

  it('cuisine Thai → 0', () => {
    expect(ids({ cuisines: ['Thai'] })).toEqual([]);
  });

  it('chef effort + oven → all 10', () => {
    expect(
      ids({ effort: 'chef', equipment: [...DEFAULT_PREFERENCES.equipment, 'oven'] }),
    ).toHaveLength(10);
  });

  it('applies the filter chip, then the sort', () => {
    expect(ids({ filter: 'quick', sort: 'quick' })).toEqual([
      'masala-omelette', // 10 min, ties keep data.js order
      'curd-rice',
      'egg-fried-rice',
      'paneer-bhurji',
      'tomato-pasta',
    ]);
    expect(ids({ filter: 'onepan' })).toEqual(
      expect.arrayContaining(['egg-fried-rice', 'shakshuka', 'tomato-pasta']),
    );
    expect(ids({ filter: 'protein', sort: 'protein' })).toEqual(['tikka-wrap', 'butter-chicken']);
    expect(ids({ sort: 'effort' })[0]).toBe('egg-fried-rice');
  });

  it('"uses everything" keeps only 100% matches', () => {
    const all = rankSuggestions(MOCKUP_RECIPES, {
      kitchen,
      prefs: { ...DEFAULT_PREFERENCES, filter: 'everything' },
      allergies: [],
    });
    expect(all.length).toBeGreaterThan(0);
    expect(all.every((s) => s.match.pct === 100)).toBe(true);
  });
});

describe('passes', () => {
  const bc = recipeById('butter-chicken');
  it('rejects on time, effort, equipment, diet, cuisine and allergens', () => {
    expect(passes(bc, DEFAULT_PREFERENCES, [])).toBe(true);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, timeMin: 30 }, [])).toBe(false);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, effort: 'minimal' }, [])).toBe(false);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, equipment: ['oven'] }, [])).toBe(false);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, diet: 'egg' }, [])).toBe(false);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, cuisines: ['Italian'] }, [])).toBe(false);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, cuisines: ['Italian', 'Indian'] }, [])).toBe(true);
    expect(passes(bc, DEFAULT_PREFERENCES, ['Dairy'])).toBe(false);
    expect(passes(bc, DEFAULT_PREFERENCES, ['Nuts', 'Unknown'])).toBe(true);
  });

  it('vegan only allows vegan; keto / protein are goals, not filters', () => {
    expect(passes(recipeById('palak-paneer'), { ...DEFAULT_PREFERENCES, diet: 'vegan' }, [])).toBe(
      false,
    );
    expect(passes(bc, { ...DEFAULT_PREFERENCES, diet: 'keto' }, [])).toBe(true);
    expect(passes(bc, { ...DEFAULT_PREFERENCES, diet: 'protein' }, [])).toBe(true);
  });
});

describe('score', () => {
  const base = { ...DEFAULT_PREFERENCES, mood: 'none', spice: 5 };
  const r = recipeById('masala-omelette'); // 310 kcal, 19 g protein, 6 g carbs, spice 2
  const m = match(r, kitchen, 2);

  it('starts at match % and adds mood, hunger, spice and diet-goal nudges', () => {
    expect(score(r, m, base)).toBe(m.pct);
    expect(score(r, m, { ...base, mood: 'lazy' })).toBe(m.pct + 15);
    expect(score(r, m, { ...base, hunger: 'snack' })).toBe(m.pct + 8);
    expect(score(r, m, { ...base, hunger: 'starving' })).toBe(m.pct);
    expect(score(r, m, { ...base, spice: 3 })).toBe(m.pct + 5);
    expect(score(r, m, { ...base, diet: 'keto' })).toBe(m.pct + 10);
    expect(score(r, m, { ...base, diet: 'protein' })).toBe(m.pct);
    const bc = recipeById('butter-chicken');
    const bm = match(bc, kitchen, 2);
    expect(score(bc, bm, { ...base, hunger: 'starving', diet: 'protein' })).toBe(bm.pct + 18);
  });
});

describe('FILTERS / SORTS', () => {
  it('match the mockup definitions', () => {
    const r = recipeById('egg-fried-rice');
    const m = match(r, { ...kitchen, items: detectedFor(3) }, 2);
    expect(FILTERS.all(r, m)).toBe(true);
    expect(FILTERS.quick(r, m)).toBe(true);
    expect(FILTERS.onepan(r, m)).toBe(true);
    expect(FILTERS.protein(r, m)).toBe(false);
    const a = { recipe: r, match: m, score: 10 };
    const b = { recipe: recipeById('butter-chicken'), match: m, score: 20 };
    expect(SORTS.best(a, b)).toBeGreaterThan(0);
    expect(SORTS.quick(a, b)).toBeLessThan(0);
    expect(SORTS.effort(a, b)).toBeLessThan(0);
    expect(SORTS.protein(a, b)).toBeGreaterThan(0);
  });
});
