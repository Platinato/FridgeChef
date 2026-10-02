import { initDatabase } from '@/db/bootstrap';
import { setDatabaseForTests } from '@/db/client';
import { pantryRepo, scanRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { defaultUsed } from '@/domain/pantry';
import { MAX_PHOTOS } from '@/domain/scan';
import {
  createAppStores,
  flushWrites,
  hydrateStores,
  resetAll,
  selectKitchen,
  selectLowStaples,
  selectPendingChecks,
  selectPreferences,
  setWriteErrorReporter,
  type AppStores,
} from '@/state';
import { MOCKUP_ADDABLE, detectedFor, recipeById } from '@/testing/mockupData';

let db: NodeDriver;
let stores: AppStores;

/** Everything a store persists (actions, flags and transient state left out). */
const snapshot = (s: AppStores) => {
  const { onboarded, profile } = s.profile.getState();
  const { staples, autoInclude, excluded } = s.pantry.getState();
  const { sessionId, status, confirmedAt, photos, items, warnings, lastScan } = s.scan.getState();
  const { snapshots, saved, cooked } = s.cookbook.getState();
  return {
    profile: { onboarded, profile },
    prefs: selectPreferences(s.prefs.getState()),
    pantry: { staples, autoInclude, excluded },
    scan: { sessionId, status, confirmedAt, photos, items, warnings, lastScan },
    cookbook: { snapshots, saved, cooked },
  };
};

/** "Restart": brand-new stores over the same database. */
async function restart(): Promise<AppStores> {
  await flushWrites();
  const next = createAppStores();
  await hydrateStores(next);
  return next;
}

const warnings = [{ photoIndex: 1, type: 'blurry' as const, message: 'Photo 2 looks blurry' }];

beforeEach(async () => {
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode: 'mock' });
  stores = createAppStores();
  await hydrateStores(stores);
});

afterEach(async () => {
  await flushWrites();
  setDatabaseForTests(null);
  await db.closeAsync();
});

describe('hydrate', () => {
  it('loads the demo user', () => {
    expect(stores.profile.getState()).toMatchObject({ hydrated: true, onboarded: false });
    expect(stores.profile.getState().profile.name).toBe('Alex');
    expect(stores.pantry.getState().staples).toHaveLength(25);
    expect(stores.cookbook.getState()).toMatchObject({
      saved: ['palak-paneer', 'shakshuka'],
      cooked: ['egg-fried-rice', 'paneer-bhurji'],
    });
    expect(stores.scan.getState()).toMatchObject({
      sessionId: null,
      items: [],
      lastScan: { items: 11 },
    });
    expect(selectLowStaples(stores.pantry.getState()).map((s) => s.id)).toEqual([
      'turmeric',
      'salt',
      'olive_oil',
    ]);
  });
});

describe('restart persistence', () => {
  it('every action written through survives new stores over the same database', async () => {
    // Actions are stable functions, so grabbing them once is fine.
    const profile = stores.profile.getState();
    const prefs = stores.prefs.getState();
    const pantry = stores.pantry.getState();
    const scan = stores.scan.getState();
    const cookbook = stores.cookbook.getState();

    await profile.setName('Sam');
    await profile.toggleAllergy('Nuts');
    await profile.setUnits('imperial');
    await profile.setDiet('egg');
    await profile.setHousehold(4);
    await profile.setDefaultEffort('chef');
    await profile.completeOnboarding();

    await prefs.setMood('lazy');
    await prefs.setTimeMin(30);
    await prefs.setHunger('starving');
    await prefs.toggleCuisine('Thai');
    await prefs.toggleEquipment('oven');
    await prefs.setSpice(5);
    await prefs.setFilter('onepan');
    await prefs.setSort('protein');

    await pantry.setLevel('turmeric', 4);
    await pantry.refill('salt');
    await pantry.remove('vinegar');
    await pantry.add({ name: 'Cardamom', category: 'Spices' });
    await pantry.toggleIncluded('cumin');
    await pantry.setAutoInclude(false);

    await scan.addPhotos([{ uri: 'file:///a.jpg', label: 'Fridge' }, { uri: 'file:///b.jpg' }]);
    await scan.setDetection(detectedFor(2), warnings);
    await scan.setQty('chicken', 750);
    await scan.setUnit('milk', 'cups');
    await scan.setQty('milk', 2);
    await scan.confirmItem('paneer');
    await scan.confirmItem('yogurt');
    await scan.removeItem('lemon');
    await scan.addManualItem(MOCKUP_ADDABLE[0]!);
    expect(await scan.confirmScan()).toBe(true);

    await cookbook.toggleSave(recipeById('butter-chicken'));
    await cookbook.toggleSave(recipeById('shakshuka')); // unsave
    await cookbook.recordCooked(recipeById('curd-rice'), 2);

    const before = snapshot(stores);
    const after = snapshot(await restart());
    expect(after).toEqual(before);

    // Spot-check the values, so an action that forgot to write can't hide behind "equal".
    expect(after.profile).toMatchObject({
      onboarded: true,
      profile: {
        name: 'Sam',
        allergies: ['Nuts'],
        householdSize: 4,
        diet: 'egg',
        units: 'imperial',
      },
    });
    expect(after.prefs).toMatchObject({
      servings: 4,
      diet: 'egg',
      effort: 'chef',
      mood: 'lazy',
      cuisines: ['Thai'],
      filter: 'onepan',
      sort: 'protein',
    });
    expect(after.pantry.excluded).toEqual({ cumin: true });
    expect(after.pantry.autoInclude).toBe(false);
    expect(after.pantry.staples.at(-1)).toMatchObject({ id: 'cardamom', level: 5 });
    expect(after.pantry.staples.find((s) => s.id === 'salt')?.level).toBe(5);
    expect(after.scan.photos.map((p) => p.label)).toEqual(['Fridge', undefined]);
    expect(after.scan.items.find((i) => i.id === 'chicken')).toMatchObject({
      value: 750,
      touched: true,
    });
    expect(after.scan.items.find((i) => i.id === 'milk')).toMatchObject({
      value: 480,
      displayUnit: 'cups',
    });
    expect(after.scan.items.at(-1)).toMatchObject({ id: 'cream', confidence: 'manual' });
    expect(after.scan).toMatchObject({
      status: 'confirmed',
      lastScan: { items: after.scan.items.length },
    });
    expect(after.cookbook.saved).toEqual(['butter-chicken', 'palak-paneer']);
    expect(after.cookbook.cooked[0]).toBe('curd-rice');
  });

  it('transient state is not persisted', async () => {
    stores.scan.getState().setDetecting(true);
    expect((await restart()).scan.getState().detecting).toBe(false);
  });
});

describe('scan', () => {
  it('caps a scan at 6 photos', async () => {
    const scan = stores.scan.getState();
    const five = Array.from({ length: 5 }, (_, i) => ({ uri: `file:///${i}.jpg` }));
    expect(await scan.addPhotos(five)).toEqual({ added: 5, dropped: 0 });
    expect(await scan.addPhotos([{ uri: 'file:///x.jpg' }, { uri: 'file:///y.jpg' }])).toEqual({
      added: 1,
      dropped: 1,
    });
    expect(await scan.addPhotos([{ uri: 'file:///z.jpg' }])).toEqual({ added: 0, dropped: 1 });
    expect(stores.scan.getState().photos).toHaveLength(MAX_PHOTOS);
    expect((await restart()).scan.getState().photos).toHaveLength(MAX_PHOTOS);
  });

  it('the confirm gate waits for every low-confidence item', async () => {
    const scan = () => stores.scan.getState();
    expect(await scan().confirmScan()).toBe(false); // no session yet
    await scan().setDetection(detectedFor(3), []);
    expect(selectPendingChecks(scan()).map((i) => i.id)).toEqual(['chicken', 'paneer', 'yogurt']);
    expect(await scan().confirmScan()).toBe(false);
    await scan().setQty('chicken', 500); // a slider move counts as a check
    await scan().confirmItem('paneer');
    expect(await scan().confirmScan()).toBe(false);
    await scan().removeItem('yogurt'); // removing it also clears the gate
    expect(selectPendingChecks(scan())).toEqual([]);
    expect(await scan().confirmScan()).toBe(true);
    expect(scan()).toMatchObject({ status: 'confirmed', lastScan: { items: 11 } });

    // A new detection resets the confirmation.
    await scan().setDetection(detectedFor(1), []);
    expect(scan()).toMatchObject({ status: 'detected', confirmedAt: null });
  });

  it('unit switch only accepts the item’s units; qty is stored in the base unit and clamped', async () => {
    const scan = () => stores.scan.getState();
    await scan().setDetection(detectedFor(3), []);
    expect(await scan().setUnit('eggs', 'kg')).toBe(false);
    await scan().setUnit('eggs', 'g');
    await scan().setQty('eggs', 300);
    expect(scan().items.find((i) => i.id === 'eggs')).toMatchObject({ value: 6, displayUnit: 'g' });
    await scan().setQty('rice', 999_999);
    expect(scan().items.find((i) => i.id === 'rice')?.value).toBe(5000);
    expect(await scan().setQty('ghost', 1)).toBe(false);
    expect(await scan().removeItem('ghost')).toBe(false);
  });

  it('manual items can’t be added twice', async () => {
    const scan = () => stores.scan.getState();
    expect(await scan().addManualItem(MOCKUP_ADDABLE[0]!)).toBe(true);
    expect(await scan().addManualItem(MOCKUP_ADDABLE[0]!)).toBe(false);
    expect(scan().items).toHaveLength(1);
  });

  it('removing / retaking photos keeps warnings attached to the right photo', async () => {
    const scan = () => stores.scan.getState();
    await scan().addPhotos([{ uri: 'a' }, { uri: 'b' }, { uri: 'c' }]);
    await scan().setDetection(detectedFor(3), [
      { photoIndex: 1, type: 'blurry', message: 'Photo 2 looks blurry' },
      { photoIndex: 2, type: 'dark', message: 'Photo 3 is dark' },
    ]);
    const [a, b] = scan().photos;
    await scan().markRetaken(b!.id);
    expect(scan().warnings.map((w) => w.type)).toEqual(['dark']);
    await scan().removePhoto(a!.id);
    expect(scan().warnings).toEqual([{ photoIndex: 1, type: 'dark', message: 'Photo 3 is dark' }]);
    const restarted = (await restart()).scan.getState();
    expect(restarted.warnings).toEqual(scan().warnings);
    expect(restarted.photos[0]).toMatchObject({ retaken: true });
  });

  it('resetScan deletes the session (cascade) but keeps lastScan', async () => {
    const scan = () => stores.scan.getState();
    await scan().addPhotos([{ uri: 'a' }]);
    await scan().setDetection(detectedFor(1), warnings);
    await scan().resetScan();
    expect(scan()).toMatchObject({ sessionId: null, items: [], photos: [] });
    await flushWrites();
    expect(await scanRepo.loadLatest(db)).toBeNull();
    expect((await restart()).scan.getState().lastScan).toMatchObject({ items: 11 });
    expect(await scan().resetScan()).toBe(true); // nothing to delete
  });
});

describe('prefs', () => {
  it('cuisine "Any" is exclusive; loosen + addTime', async () => {
    const prefs = () => stores.prefs.getState();
    await prefs().toggleCuisine('Thai');
    await prefs().toggleCuisine('Indian');
    expect(prefs().cuisines).toEqual(['Thai', 'Indian']);
    await prefs().toggleCuisine('Any');
    expect(prefs().cuisines).toEqual(['Any']);
    await prefs().toggleCuisine('Thai');
    await prefs().toggleCuisine('Thai');
    expect(prefs().cuisines).toEqual(['Any']);

    await prefs().update({ filter: 'quick', cuisines: ['Thai'], effort: 'minimal' });
    await prefs().loosenFilters();
    expect(prefs()).toMatchObject({ filter: 'all', cuisines: ['Any'], effort: 'chef' });
    await prefs().setTimeMin(100);
    await prefs().addTime();
    expect(prefs().timeMin).toBe(120);
    await prefs().setServings(3);
    await prefs().setEffort('minimal');
    await prefs().setDiet('vegan');
    expect(selectPreferences((await restart()).prefs.getState())).toEqual(
      selectPreferences(prefs()),
    );
  });

  it('household size syncs servings; replaying onboarding is persisted', async () => {
    await stores.profile.getState().setHousehold(5);
    expect(stores.prefs.getState().servings).toBe(5);
    await stores.profile.getState().completeOnboarding();
    await stores.profile.getState().replayOnboarding();
    expect((await restart()).profile.getState().onboarded).toBe(false);
  });
});

describe('pantry', () => {
  it('applyCooking deducts in one transaction and reports newly low staples', async () => {
    await stores.scan.getState().setDetection(detectedFor(3), []);
    const bc = recipeById('butter-chicken');
    const kitchen = selectKitchen(stores.scan.getState(), stores.pantry.getState());
    const result = await stores.pantry.getState().applyCooking(defaultUsed(bc, kitchen, 2));
    expect(result.saved).toBe(true);
    expect(result.newlyLow.map((s) => s.id).sort()).toEqual(['garam_masala', 'red_chilli']);

    const restarted = await restart();
    expect(restarted.scan.getState().items.find((i) => i.id === 'chicken')?.value).toBe(100);
    expect(restarted.pantry.getState().staples.find((s) => s.id === 'garam_masala')?.level).toBe(
      1.5,
    );
  });

  it('applyCooking rolls back both tables when the write fails', async () => {
    await stores.scan.getState().setDetection(detectedFor(3), []);
    await flushWrites();
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const reported: string[] = [];
    setWriteErrorReporter((label) => reported.push(label));
    // Staples are written first; make the scan-item update after them fail.
    await db.execAsync(
      "CREATE TRIGGER no_items BEFORE UPDATE ON scan_items BEGIN SELECT RAISE(ABORT, 'disk full'); END",
    );
    const result = await stores.pantry.getState().applyCooking({ chicken: 100, salt: 1 });
    expect(result.saved).toBe(false);
    expect(reported).toEqual(['pantry.applyCooking']);
    expect(errors).toHaveBeenCalled();
    const items = (await scanRepo.loadLatest(db))?.items;
    expect(items?.find((i) => i.id === 'chicken')?.value).toBe(500);
    // The staple write in the same transaction was rolled back too.
    expect((await pantryRepo.list(db)).staples.find((s) => s.id === 'salt')?.level).toBe(1);
    setWriteErrorReporter(null);
    errors.mockRestore();
  });

  it('add ignores duplicates; unknown ids are no-ops', async () => {
    const pantry = () => stores.pantry.getState();
    expect(await pantry().add({ name: 'Salt', category: 'Spices' })).toBe(false);
    expect(await pantry().setLevel('ghost', 3)).toBe(false);
    await pantry().setLevel('cumin', 9);
    expect(pantry().staples.find((s) => s.id === 'cumin')?.level).toBe(5);
    await pantry().toggleIncluded('cumin');
    await pantry().toggleIncluded('cumin');
    await pantry().toggleIncluded('salt');
    await pantry().remove('salt');
    expect(pantry().excluded).toEqual({});
    await flushWrites();
    expect((await pantryRepo.list(db)).excluded).toEqual({});
  });
});

describe('cookbook', () => {
  it('keeps 6 distinct cooked recipes; refreshSnapshot only updates known recipes', async () => {
    const cookbook = () => stores.cookbook.getState();
    for (const id of [
      'curd-rice',
      'tomato-pasta',
      'tikka-wrap',
      'shakshuka',
      'butter-chicken',
      'curd-rice',
    ]) {
      await cookbook().recordCooked(recipeById(id), 2);
    }
    expect(cookbook().cooked).toEqual([
      'curd-rice',
      'butter-chicken',
      'shakshuka',
      'tikka-wrap',
      'tomato-pasta',
      'egg-fried-rice',
    ]);
    expect(await cookbook().refreshSnapshot(recipeById('masala-omelette'))).toBe(false);
    await cookbook().refreshSnapshot({ ...recipeById('curd-rice'), name: 'Curd Rice 2' });
    const restarted = (await restart()).cookbook.getState();
    expect(restarted.cooked).toEqual(cookbook().cooked);
    expect(restarted.snapshots['curd-rice']?.name).toBe('Curd Rice 2');
  });
});

describe('reset + seed', () => {
  it('resetAll wipes, reseeds the demo user and re-hydrates', async () => {
    await stores.profile.getState().setName('Sam');
    await stores.scan.getState().setDetection(detectedFor(3), []);
    await stores.pantry.getState().remove('salt');
    await resetAll(stores, { mode: 'mock' });
    expect(stores.profile.getState().profile.name).toBe('Alex');
    expect(stores.scan.getState().items).toEqual([]);
    expect(stores.pantry.getState().staples).toHaveLength(25);
  });

  it('seeds the demo data only once', async () => {
    await stores.profile.getState().setName('Sam');
    await flushWrites();
    expect((await initDatabase({ mode: 'mock' })).seeded).toBe(false);
    expect((await restart()).profile.getState().profile.name).toBe('Sam');
  });
});

describe('write failures', () => {
  it('are logged, reported in dev, and resolve false', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const reported: string[] = [];
    setWriteErrorReporter((label) => reported.push(label));
    setDatabaseForTests(null);
    expect(await stores.profile.getState().setName('X')).toBe(false);
    expect(stores.profile.getState().profile.name).toBe('X'); // the UI keeps the new value
    expect(reported).toEqual(['profile.save']);
    expect(errors.mock.calls[0]?.[0]).toBe('[db] profile.save failed');
    setWriteErrorReporter(null);
    errors.mockRestore();
    setDatabaseForTests(db);
  });
});
