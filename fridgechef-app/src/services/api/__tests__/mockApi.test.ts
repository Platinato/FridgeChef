import { migrate, getUserVersion } from '@/db/migrate';
import type { NodeDriver } from '@/db/testing/nodeDriver';
import { ApiError } from '@/services/api/errors';
import { mockRepo } from '@/services/api/mock/db/mockRepo';
import { mockMigrations, prepareMockDatabase } from '@/services/api/mock/db/schema';
import { createMockDb, detectInput, fastMockApi, suggestInput } from '@/testing/apiHelpers';
import { mockupKitchen } from '@/testing/mockupData';

let db: NodeDriver;
beforeEach(async () => {
  db = await createMockDb();
});
afterEach(() => db.closeAsync());

describe('mock database', () => {
  it('is seeded with 1 catalog, 12 detections, 10 recipes, 6 demo photos', async () => {
    expect(await mockRepo.counts(db)).toEqual({
      catalog: 1,
      detections: 12,
      recipes: 10,
      demoPhotos: 6,
    });
    expect(await getUserVersion(db)).toBe(mockMigrations.length);
  });

  it('reopening does not seed twice', async () => {
    await prepareMockDatabase(db);
    await migrate(db, mockMigrations);
    expect(await mockRepo.counts(db)).toEqual({
      catalog: 1,
      detections: 12,
      recipes: 10,
      demoPhotos: 6,
    });
  });

  it('reseed restores the seed', async () => {
    await db.runAsync("DELETE FROM mock_recipes WHERE id = 'curd-rice'");
    await db.runAsync("UPDATE mock_detections SET dto = '{}' WHERE id = 'milk'");
    await mockRepo.reseed(db);
    expect((await mockRepo.counts(db)).recipes).toBe(10);
    expect(await mockRepo.recipe(db, 'curd-rice')).toMatchObject({ id: 'curd-rice' });
    expect(
      (await mockRepo.detections(db, 1)).find((d) => (d as { id: string }).id === 'milk'),
    ).toMatchObject({
      estimate: 750,
    });
  });
});

describe('MockApi behaviour (api-contract.md → Mock behaviour)', () => {
  it('detect: only items from the sent photos; the 2nd photo is blurry with 3+', async () => {
    const api = fastMockApi(db);
    const one = await api.detectIngredients(detectInput(1));
    expect(one.items.every((i) => i.photoIndex === 0)).toBe(true);
    expect(one.items).toHaveLength(8);
    expect(one.warnings).toEqual([]);
    const two = await api.detectIngredients(detectInput(2));
    expect(two.items).toHaveLength(12);
    expect(two.warnings).toEqual([]);
    const three = await api.detectIngredients(detectInput(3));
    expect(three.warnings).toEqual([
      { photoIndex: 1, type: 'blurry', message: 'Photo 2 looks blurry' },
    ]);
    expect(three.scanId).toMatch(/^scn_mock_/);
  });

  it('suggest: filters by preferences with the domain rules (not by match)', async () => {
    const api = fastMockApi(db);
    const ids = async (prefs = {}, allergies: string[] = []) =>
      (
        await api.suggestRecipes({
          ...suggestInput(mockupKitchen(), prefs),
          profile: { allergies },
        })
      ).map((r) => r.id);
    expect(await ids()).toHaveLength(9);
    expect(await ids()).not.toContain('lemon-chicken-bowl');
    expect(await ids({ timeMin: 15 })).toHaveLength(4);
    expect(await ids({}, ['Dairy'])).toEqual(['egg-fried-rice', 'shakshuka']);
    expect(await ids({ cuisines: ['Thai'] })).toEqual([]);
    expect(await api.suggestRecipes({ ...suggestInput(mockupKitchen()), limit: 2 })).toHaveLength(
      2,
    );
  });

  it('recipe: by id, or ApiError not_found', async () => {
    const api = fastMockApi(db);
    expect((await api.getRecipe('shakshuka')).name).toBe('Shakshuka');
    const err = await api.getRecipe('nope').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ kind: 'not_found', status: 404 });
  });

  it('injects server errors at the failure rate', async () => {
    const api = fastMockApi(db, { failureRate: 0.5, random: () => 0.4 });
    await expect(api.getCatalog()).rejects.toMatchObject({ kind: 'server', status: 503 });
    const lucky = fastMockApi(db, { failureRate: 0.5, random: () => 0.6 });
    await expect(lucky.getCatalog()).resolves.toHaveProperty('moods');
  });

  it('latency is abortable', async () => {
    const api = fastMockApi(db, { latencyMs: 10_000 });
    const controller = new AbortController();
    const pending = api.getCatalog(controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ kind: 'network', cancelled: true });
  });

  it('opens the database lazily, on the first call', async () => {
    const openDb = jest.fn(async () => db);
    const api = fastMockApi(db, { openDb });
    expect(openDb).not.toHaveBeenCalled();
    await api.getCatalog();
    expect(openDb).toHaveBeenCalled();
  });

  it('an empty mock database answers 500 → server', async () => {
    await db.runAsync('DELETE FROM mock_catalog');
    await expect(fastMockApi(db).getCatalog()).rejects.toMatchObject({
      kind: 'server',
      status: 500,
    });
  });
});
