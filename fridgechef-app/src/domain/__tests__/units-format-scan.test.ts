import { MOCKUP_ADDABLE, MOCKUP_ITEMS } from '@/testing/mockupData';
import {
  daysAgo,
  daysSince,
  effortLabel,
  fmtNum,
  fmtQty,
  lastScanLabel,
  plural,
  timeAgo,
} from '@/domain/format';
import {
  ADD_TIME_MIN,
  DEFAULT_PREFERENCES,
  addTime,
  loosen,
  toggleCuisine,
  toggleIn,
} from '@/domain/preferences';
import {
  MAX_PHOTOS,
  capPhotos,
  manualItem,
  pendingChecks,
  removePhotoAt,
  retakePhoto,
  sortByConfidence,
} from '@/domain/scan';
import type { DetectedItem, Photo, PhotoWarning } from '@/domain/types';
import { displayOf, snap, toBase, unitsOf } from '@/domain/units';

const item = (id: string): DetectedItem => {
  const found = MOCKUP_ITEMS.find((i) => i.id === id);
  if (!found) throw new Error(id);
  return { ...found };
};

describe('units', () => {
  it('eggs 6 pcs ⇄ 300 g', () => {
    const eggs = { ...item('eggs'), displayUnit: 'g' };
    expect(displayOf(eggs)).toMatchObject({ value: 300, unit: 'g', step: 50, estimate: 300 });
    expect(toBase(eggs, 300)).toBe(6);
    expect(displayOf(item('eggs'))).toMatchObject({ value: 6, unit: 'pcs', step: 1 });
  });

  it('milk 750 ml → 3.25 cups, snapped to the 0.25 step', () => {
    const milk = { ...item('milk'), displayUnit: 'cups' };
    expect(displayOf(milk)).toEqual({
      value: 3.25,
      min: 0,
      max: 8.25,
      step: 0.25,
      unit: 'cups',
      estimate: 3.25,
    });
    expect(toBase(milk, 2)).toBe(480);
  });

  it('toBase clamps to the item range; items without alt units pass through', () => {
    const onion = { ...item('onion'), displayUnit: 'g' };
    expect(displayOf(onion).value).toBe(350); // 3 pcs × 110 g, snapped to 50
    expect(toBase(onion, 5000)).toBe(12);
    expect(toBase(item('chicken'), 750)).toBe(750);
    expect(toBase(item('chicken'), 10)).toBe(100);
    expect(unitsOf(item('chicken'))).toEqual(['g']);
    expect(unitsOf(item('milk'))).toEqual(['ml', 'cups']);
    expect(displayOf({ ...manualItem(MOCKUP_ADDABLE[0]!) }).estimate).toBeNull();
    expect(displayOf({ ...item('milk'), displayUnit: 'cups', estimate: null }).estimate).toBeNull();
  });

  it('snap trims float noise', () => {
    expect(snap(0.3, 0.1)).toBe(0.3);
  });
});

describe('format', () => {
  const NOW = Date.parse('2026-09-29T09:00:00Z');

  it('fmtQty uses quarter fractions', () => {
    expect(fmtQty(0.5, 'tsp')).toBe('½ tsp');
    expect(fmtQty(0.25, 'tsp')).toBe('¼ tsp');
    expect(fmtQty(1.75, 'cup')).toBe('1¾ cup');
    expect(fmtQty(400, 'g')).toBe('400 g');
    expect(fmtQty(1.3333, 'pcs')).toBe('1.33 pcs');
  });

  it('fmtNum, plural, effortLabel', () => {
    expect(fmtNum(3.14159)).toBe('3.14');
    expect(fmtNum(2)).toBe('2');
    expect(plural(1, 'photo')).toBe('1 photo');
    expect(plural(3, 'photo')).toBe('3 photos');
    expect([1, 2, 3, 4, 5].map(effortLabel)).toEqual([
      'Minimal',
      'Moderate',
      'Moderate',
      'Chef mode',
      'Chef mode',
    ]);
  });

  it('timeAgo / lastScanLabel / daysSince', () => {
    expect(timeAgo(daysAgo(0, NOW), NOW)).toBe('today');
    expect(timeAgo(daysAgo(1, NOW), NOW)).toBe('yesterday');
    expect(timeAgo(daysAgo(9, NOW), NOW)).toBe('9d ago');
    expect(lastScanLabel({ at: daysAgo(2, NOW), items: 11 }, NOW)).toBe('2 days ago · 11 items');
    expect(lastScanLabel({ at: daysAgo(1, NOW), items: 3 }, NOW)).toBe('Yesterday · 3 items');
    expect(lastScanLabel({ at: daysAgo(0, NOW), items: 3 }, NOW)).toBe('Today · 3 items');
    expect(daysSince(new Date(NOW + 5 * 864e5).toISOString(), NOW)).toBe(0);
    expect(typeof timeAgo(new Date().toISOString())).toBe('string');
  });
});

describe('scan', () => {
  it('pendingChecks = low confidence and untouched', () => {
    const items = MOCKUP_ITEMS.map((i) => ({ ...i }));
    expect(pendingChecks(items).map((i) => i.id)).toEqual(['chicken', 'paneer', 'yogurt']);
    items[0]!.touched = true;
    expect(pendingChecks(items).map((i) => i.id)).toEqual(['paneer', 'yogurt']);
  });

  it('sortByConfidence: low → med → high → manual, stable', () => {
    const items = [manualItem(MOCKUP_ADDABLE[0]!), ...MOCKUP_ITEMS.slice().reverse()];
    const sorted = sortByConfidence(items).map((i) => i.confidence);
    expect(sorted.indexOf('med')).toBe(3);
    expect(sorted.at(-1)).toBe('manual');
    expect(
      sortByConfidence(MOCKUP_ITEMS)
        .slice(0, 3)
        .map((i) => i.id),
    ).toEqual(['chicken', 'paneer', 'yogurt']);
  });

  const photo = (id: string): Photo => ({ id, uri: `file:///${id}.jpg`, retaken: false });

  it('capPhotos keeps at most 6', () => {
    const four = ['a', 'b', 'c', 'd'].map(photo);
    const r = capPhotos(four, ['e', 'f', 'g'].map(photo));
    expect(r.photos).toHaveLength(MAX_PHOTOS);
    expect(r.dropped).toBe(1);
    expect(capPhotos(r.photos, [photo('h')])).toEqual({ photos: r.photos, dropped: 1 });
  });

  it('removePhotoAt drops that photo’s warnings and shifts later ones', () => {
    const photos = ['a', 'b', 'c'].map(photo);
    const warnings: PhotoWarning[] = [
      { photoIndex: 1, type: 'blurry', message: 'Photo 2 looks blurry' },
      { photoIndex: 2, type: 'dark', message: 'Photo 3 is dark' },
    ];
    const r = removePhotoAt(photos, warnings, 'b');
    expect(r.photos.map((p) => p.id)).toEqual(['a', 'c']);
    expect(r.warnings).toEqual([{ photoIndex: 1, type: 'dark', message: 'Photo 3 is dark' }]);
    expect(removePhotoAt(photos, warnings, 'zz')).toEqual({ photos, warnings });
  });

  it('retakePhoto marks it retaken and clears its warnings', () => {
    const photos = ['a', 'b'].map(photo);
    const warnings: PhotoWarning[] = [{ photoIndex: 1, type: 'blurry', message: 'x' }];
    const r = retakePhoto(photos, warnings, 'b');
    expect(r.photos[1]).toMatchObject({ id: 'b', retaken: true });
    expect(r.warnings).toEqual([]);
    expect(retakePhoto(photos, warnings, 'zz')).toEqual({ photos, warnings });
  });

  it('manualItem is confirmed with no estimate', () => {
    expect(manualItem(MOCKUP_ADDABLE[0]!)).toMatchObject({
      id: 'cream',
      category: 'Added',
      confidence: 'manual',
      estimate: null,
      value: 200,
      touched: true,
      photoIndex: null,
    });
  });
});

describe('preferences', () => {
  it('toggleCuisine: "Any" is exclusive and the fallback', () => {
    expect(toggleCuisine(['Any'], 'Thai')).toEqual(['Thai']);
    expect(toggleCuisine(['Thai'], 'Indian')).toEqual(['Thai', 'Indian']);
    expect(toggleCuisine(['Thai', 'Indian'], 'Any')).toEqual(['Any']);
    expect(toggleCuisine(['Thai'], 'Thai')).toEqual(['Any']);
  });

  it('toggleIn, loosen, addTime', () => {
    expect(toggleIn(['stove'], 'oven')).toEqual(['stove', 'oven']);
    expect(toggleIn(['stove', 'oven'], 'stove')).toEqual(['oven']);
    expect(loosen({ ...DEFAULT_PREFERENCES, filter: 'quick', cuisines: ['Thai'] })).toMatchObject({
      filter: 'all',
      cuisines: ['Any'],
      effort: 'chef',
    });
    expect(addTime(DEFAULT_PREFERENCES).timeMin).toBe(45 + ADD_TIME_MIN);
    expect(addTime({ ...DEFAULT_PREFERENCES, timeMin: 100 }).timeMin).toBe(120);
  });
});
