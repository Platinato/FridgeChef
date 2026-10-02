import { mockupKitchen, recipeById } from '@/testing/mockupData';
import { ingredientStatus, match } from '@/domain/matching';
import {
  applyCooking,
  clampLevel,
  defaultUsed,
  isLow,
  lowStaples,
  newStaple,
  slug,
  stapleOn,
} from '@/domain/pantry';
import type { Kitchen } from '@/domain/types';

const NOW = Date.parse('2026-09-29T09:00:00Z');
const NOW_ISO = new Date(NOW).toISOString();
const kitchen = (): Kitchen => mockupKitchen(NOW);
const withChicken = (k: Kitchen, value: number): Kitchen => ({
  ...k,
  items: k.items.map((i) => (i.id === 'chicken' ? { ...i, value, touched: true } : i)),
});

describe('butter chicken regression', () => {
  const bc = recipeById('butter-chicken');

  it('with chicken 500 g is 91%, missing only cream', () => {
    const m = match(bc, withChicken(kitchen(), 500), 2);
    expect(m.pct).toBe(91);
    expect(m.have).toBe(10);
    expect(m.total).toBe(11);
    expect(m.missing.map((r) => r.name)).toEqual(['Fresh cream']);
  });

  it('defaultUsed includes chicken 400 and the pantry staples', () => {
    const used = defaultUsed(bc, withChicken(kitchen(), 500), 2);
    expect(used).toMatchObject({
      chicken: 400,
      tomato: 3,
      garam_masala: 1,
      red_chilli: 1,
      salt: 1,
    });
    expect(used).not.toHaveProperty('cream');
  });

  it('applyCooking makes garam masala + red chilli newly low (2 items)', () => {
    const k = withChicken(kitchen(), 500);
    const result = applyCooking(defaultUsed(bc, k, 2), k, NOW_ISO);
    expect(result.newlyLow.map((s) => s.id).sort()).toEqual(['garam_masala', 'red_chilli']);
    expect(result.items.find((i) => i.id === 'chicken')?.value).toBe(100);
    const gm = result.staples.find((s) => s.id === 'garam_masala');
    expect(gm).toMatchObject({ level: 1.5, updatedAt: NOW_ISO });
    // Salt was already low: deducted, but not "newly" low.
    expect(result.staples.find((s) => s.id === 'salt')?.level).toBe(0.95);
    expect(result.changedItemIds).toContain('chicken');
    expect(result.changedStapleIds).toContain('butter');
    // Untouched staples keep their object and timestamp.
    expect(result.staples.find((s) => s.id === 'oregano')).toBe(
      k.staples.find((s) => s.id === 'oregano'),
    );
  });

  it('servings scale the need', () => {
    const m = match(bc, withChicken(kitchen(), 500), 4);
    expect(m.rows.find((r) => r.id === 'chicken')).toMatchObject({ need: 800, status: 'short' });
  });
});

describe('ingredientStatus', () => {
  it('detected: have / short / missing by amount', () => {
    const k = kitchen();
    const ing = { id: 'chicken', name: 'Chicken breast', qty: 400, unit: 'g' };
    expect(ingredientStatus(ing, withChicken(k, 400), 1).status).toBe('have');
    expect(ingredientStatus(ing, withChicken(k, 100), 1).status).toBe('short');
    expect(ingredientStatus(ing, withChicken(k, 0), 1)).toMatchObject({
      kind: 'detected',
      status: 'missing',
      have: 0,
    });
  });

  it('staples are pantry unless excluded, auto-include is off, or empty', () => {
    const ing = { id: 'salt', name: 'Salt', qty: 1, unit: 'tsp' };
    const k = kitchen();
    expect(ingredientStatus(ing, k, 1)).toMatchObject({ kind: 'staple', status: 'pantry' });
    expect(ingredientStatus(ing, { ...k, excluded: { salt: true } }, 1).status).toBe('missing');
    expect(ingredientStatus(ing, { ...k, autoInclude: false }, 1).status).toBe('missing');
    const empty = {
      ...k,
      staples: k.staples.map((s) => (s.id === 'salt' ? { ...s, level: 0 } : s)),
    };
    expect(ingredientStatus(ing, empty, 1).status).toBe('missing');
  });

  it('unknown ids are missing extras, named from the recipe', () => {
    expect(ingredientStatus({ id: 'x', name: 'Saffron', qty: 1, unit: 'g' }, kitchen(), 2)).toEqual(
      { kind: 'extra', name: 'Saffron', need: 2, status: 'missing' },
    );
  });

  it('a recipe with no ingredients is 0%', () => {
    expect(match({ ...recipeById('curd-rice'), ingredients: [] }, kitchen(), 2).pct).toBe(0);
  });
});

describe('pantry helpers', () => {
  it('isLow / lowStaples use the 1.5-bar threshold', () => {
    expect(isLow({ level: 1.5 })).toBe(true);
    expect(isLow({ level: 1.51 })).toBe(false);
    expect(
      lowStaples(kitchen().staples)
        .map((s) => s.id)
        .sort(),
    ).toEqual(['olive_oil', 'salt', 'turmeric']);
  });

  it('stapleOn needs auto-include, not excluded, and level > 0', () => {
    const s = kitchen().staples[0]!;
    expect(stapleOn(s, { autoInclude: true, excluded: {} })).toBe(true);
    expect(stapleOn(s, { autoInclude: true, excluded: { [s.id]: true } })).toBe(false);
    expect(stapleOn(s, { autoInclude: false, excluded: {} })).toBe(false);
    expect(stapleOn({ ...s, level: 0 }, { autoInclude: true, excluded: {} })).toBe(false);
  });

  it('applyCooking never goes below zero and skips zero staple amounts', () => {
    const k = kitchen();
    const r = applyCooking({ chicken: 9999, salt: 9999, cumin: 0, ghost: 1 }, k, NOW_ISO);
    expect(r.items.find((i) => i.id === 'chicken')?.value).toBe(0);
    expect(r.staples.find((s) => s.id === 'salt')?.level).toBe(0);
    expect(r.changedStapleIds).toEqual(['salt']);
  });

  it('newStaple starts as a full new pack with a slug id', () => {
    expect(slug('  Bay leaf! ')).toBe('bay_leaf');
    expect(newStaple({ name: 'Sesame oil', category: 'Oils & Fats' }, NOW_ISO)).toEqual({
      id: 'sesame_oil',
      name: 'Sesame oil',
      category: 'Oils & Fats',
      unitHint: 'New pack',
      unit: 'tsp',
      perLevel: 4,
      level: 5,
      updatedAt: NOW_ISO,
    });
    expect(clampLevel(7)).toBe(5);
    expect(clampLevel(-1)).toBe(0);
  });
});
