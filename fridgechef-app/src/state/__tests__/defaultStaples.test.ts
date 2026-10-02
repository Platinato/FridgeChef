import { initDatabase } from '@/db/bootstrap';
import { setDatabaseForTests } from '@/db/client';
import { metaRepo, pantryRepo } from '@/db/repositories';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { createAppStores, flushWrites, hydrateStores, type AppStores } from '@/state';
import { catalogSeed } from '@/services/api/mock/db/seed/catalog';

let db: NodeDriver;
let stores: AppStores;
const defaults = catalogSeed.defaultStaples;

async function boot(mode: 'mock' | 'http') {
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode });
  stores = createAppStores();
  await hydrateStores(stores);
}

afterEach(async () => {
  await flushWrites();
  setDatabaseForTests(null);
  await db.closeAsync();
});

describe('pantry.applyDefaultStaples (http mode first launch)', () => {
  it('fills an empty pantry once, at 3 bars, and remembers that it did', async () => {
    await boot('http');
    expect(stores.pantry.getState().staples).toEqual([]);
    expect(await stores.pantry.getState().applyDefaultStaples(defaults)).toBe(25);
    expect(stores.pantry.getState().staples).toHaveLength(25);
    expect(stores.pantry.getState().staples.every((s) => s.level === 3)).toBe(true);
    expect((await pantryRepo.list(db)).staples).toHaveLength(25);
    expect(await metaRepo.getDefaultStaplesChecked(db)).toBe(true);

    // Removing everything later doesn't bring them back.
    for (const s of stores.pantry.getState().staples) await stores.pantry.getState().remove(s.id);
    expect(await stores.pantry.getState().applyDefaultStaples(defaults)).toBe(0);
    expect(stores.pantry.getState().staples).toEqual([]);
  });

  it('leaves a non-empty pantry alone (mock mode demo)', async () => {
    await boot('mock');
    expect(await stores.pantry.getState().applyDefaultStaples(defaults.slice(0, 1))).toBe(0);
    expect(stores.pantry.getState().staples).toHaveLength(25);
    expect(await metaRepo.getDefaultStaplesChecked(db)).toBe(true);
  });
});
