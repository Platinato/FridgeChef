import { setDatabaseForTests } from '@/db/client';
import { initDatabase, resetDatabase, seedDefaults, seedDemoData } from '@/db/bootstrap';
import { reentrantTransactions } from '@/db/driver';
import { MigrationError, getUserVersion, migrate, type Migration } from '@/db/migrate';
import { LATEST_VERSION, migrations } from '@/db/migrations';
import {
  DbDataError,
  cookbookRepo,
  metaRepo,
  pantryRepo,
  prefsRepo,
  profileRepo,
  resetRepo,
  scanRepo,
} from '@/db/repositories';
import { demoUser } from '@/db/seeds/demoUser';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import type { Profile, ScanSession } from '@/domain/types';
import { MOCKUP_ITEMS, mockupStaples, recipeById } from '@/testing/mockupData';

const NOW = Date.parse('2026-09-29T09:00:00Z');
const iso = (offsetMs = 0) => new Date(NOW + offsetMs).toISOString();

let db: NodeDriver;

beforeEach(async () => {
  db = createNodeDriver();
  await migrate(db, migrations);
});
afterEach(() => db.closeAsync());

const count = async (table: string) =>
  (await db.getFirstAsync<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`))?.n;

describe('migrate', () => {
  it('migrates a fresh database to the latest user_version, and a second run changes nothing', async () => {
    const fresh = createNodeDriver();
    expect(await getUserVersion(fresh)).toBe(0);
    expect(await migrate(fresh, migrations)).toEqual({ from: 0, to: LATEST_VERSION });
    expect(await getUserVersion(fresh)).toBe(LATEST_VERSION);
    const tables = await fresh.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    expect(tables.map((t) => t.name)).toEqual(
      [
        'app_meta',
        'cooked_history',
        'preferences',
        'profile',
        'recipe_snapshots',
        'saved_recipes',
        'scan_items',
        'scan_photos',
        'scan_sessions',
        'scan_warnings',
        'staples',
      ].sort(),
    );
    const schema = await fresh.getAllAsync<{ sql: string }>('SELECT sql FROM sqlite_master');
    expect(await migrate(fresh, migrations)).toEqual({ from: LATEST_VERSION, to: LATEST_VERSION });
    expect(await fresh.getAllAsync('SELECT sql FROM sqlite_master')).toEqual(schema);
  });

  it('refuses a database newer than the app, without touching it', async () => {
    await db.execAsync('PRAGMA user_version = 99');
    await expect(migrate(db, migrations)).rejects.toThrow(MigrationError);
    await expect(migrate(db, migrations)).rejects.toThrow(/schema version 99.*only knows up to 1/);
    expect(await getUserVersion(db)).toBe(99);
  });

  it('upgrades a v1 database with user data to v2 and keeps every row (throwaway 0002)', async () => {
    // A real v1 install: migrated, seeded with the demo user, plus a confirmed scan.
    setDatabaseForTests(db);
    await initDatabase({ mode: 'mock' });
    await scanRepo.ensureSession(db, 'scn_up', iso());
    await scanRepo.saveDetection(db, 'scn_up', MOCKUP_ITEMS.slice(0, 3), []);
    await scanRepo.setStatus(db, 'scn_up', 'confirmed', iso(1));
    await metaRepo.setOnboarded(db, true);
    const before = {
      staples: await pantryRepo.list(db),
      profile: await profileRepo.get(db),
      prefs: await prefsRepo.get(db),
      scan: await scanRepo.loadLatest(db),
      cookbook: await cookbookRepo.load(db),
    };
    expect(await getUserVersion(db)).toBe(1);

    // A plausible next schema change: a new nullable column + a new table.
    const v2: Migration = {
      version: 2,
      name: '0002_test_notes',
      up: async (d) => {
        await d.execAsync('ALTER TABLE staples ADD COLUMN note TEXT');
        await d.execAsync('CREATE TABLE shopping_list (id TEXT PRIMARY KEY, name TEXT NOT NULL)');
      },
    };
    expect(await migrate(db, [...migrations, v2])).toEqual({ from: 1, to: 2 });
    expect(await getUserVersion(db)).toBe(2);

    expect(await pantryRepo.list(db)).toEqual(before.staples);
    expect(await profileRepo.get(db)).toEqual(before.profile);
    expect(await prefsRepo.get(db)).toEqual(before.prefs);
    expect(await scanRepo.loadLatest(db)).toEqual(before.scan);
    expect(await cookbookRepo.load(db)).toEqual(before.cookbook);
    expect(await metaRepo.getOnboarded(db)).toBe(true);
    expect(await count('shopping_list')).toBe(0);

    // The v1 app now meets a v2 database: refused cleanly, with the "newer" code the boot screen uses.
    const refused = await migrate(db, migrations).catch((e: unknown) => e);
    expect(refused).toBeInstanceOf(MigrationError);
    expect((refused as MigrationError).code).toBe('newer');
    expect(await getUserVersion(db)).toBe(2);
    setDatabaseForTests(null);
  });

  it('runs each migration in its own transaction: a failing one rolls back and keeps the version', async () => {
    const broken: Migration = {
      version: 2,
      name: '0002_broken',
      up: async (d) => {
        await d.execAsync('CREATE TABLE half_done (x INTEGER)');
        throw new Error('boom');
      },
    };
    await expect(migrate(db, [...migrations, broken])).rejects.toThrow('boom');
    expect(await getUserVersion(db)).toBe(1);
    expect(
      await db.getFirstAsync("SELECT name FROM sqlite_master WHERE name = 'half_done'"),
    ).toBeNull();
  });

  it('rejects migration lists with gaps', async () => {
    const gap: Migration = { version: 3, name: 'gap', up: async () => undefined };
    await expect(migrate(db, [...migrations, gap])).rejects.toThrow(/expected 2/);
  });
});

describe('repositories round-trip their domain types', () => {
  it('metaRepo', async () => {
    expect(await metaRepo.getOnboarded(db)).toBe(false);
    expect(await metaRepo.getAutoInclude(db)).toBe(true);
    expect(await metaRepo.getLastScan(db)).toBeNull();
    await metaRepo.setOnboarded(db, true);
    await metaRepo.setAutoInclude(db, false);
    await metaRepo.setLastScan(db, { at: iso(), items: 11 });
    await metaRepo.setSeededAt(db, iso());
    expect(await metaRepo.getOnboarded(db)).toBe(true);
    expect(await metaRepo.getAutoInclude(db)).toBe(false);
    expect(await metaRepo.getLastScan(db)).toEqual({ at: iso(), items: 11 });
    expect(await metaRepo.getSeededAt(db)).toBe(iso());
    await metaRepo.remove(db, 'seeded_at');
    expect(await metaRepo.get(db, 'seeded_at')).toBeNull();
  });

  it('profileRepo', async () => {
    expect(await profileRepo.get(db)).toBeNull();
    const p: Profile = {
      name: 'Sam',
      diet: 'veg',
      allergies: ['Nuts', 'Dairy'],
      householdSize: 3,
      units: 'imperial',
      defaultEffort: 'chef',
    };
    await profileRepo.save(db, p, iso());
    expect(await profileRepo.get(db)).toEqual(p);
    await profileRepo.save(db, { ...p, name: 'Sam B' });
    expect((await profileRepo.get(db))?.name).toBe('Sam B');
    expect(await count('profile')).toBe(1);
  });

  it('prefsRepo', async () => {
    expect(await prefsRepo.get(db)).toBeNull();
    const p = { ...DEFAULT_PREFERENCES, cuisines: ['Thai', 'Indian'], filter: 'quick' as const };
    await prefsRepo.save(db, p, iso());
    expect(await prefsRepo.get(db)).toEqual(p);
  });

  it('pantryRepo: order, exclusion, add, levels, remove', async () => {
    const staples = mockupStaples(NOW);
    await pantryRepo.replaceAll(db, staples, { salt: true });
    const loaded = await pantryRepo.list(db);
    expect(loaded.staples).toEqual(staples);
    expect(loaded.excluded).toEqual({ salt: true });

    const extra = { ...staples[0]!, id: 'hing', name: 'Hing' };
    expect(await pantryRepo.add(db, extra)).toBe(true);
    expect(await pantryRepo.add(db, extra)).toBe(false);
    await pantryRepo.saveLevels(db, [{ id: 'hing', level: 2.5, updatedAt: iso(1) }]);
    await pantryRepo.setIncluded(db, 'salt', true);
    await pantryRepo.remove(db, 'turmeric');
    const after = await pantryRepo.list(db);
    expect(after.staples.at(-1)).toEqual({ ...extra, level: 2.5, updatedAt: iso(1) });
    expect(after.staples.map((s) => s.id)).not.toContain('turmeric');
    expect(after.excluded).toEqual({});
  });

  it('scanRepo: session, photos, detection, item updates, manual add, status', async () => {
    expect(await scanRepo.loadLatest(db)).toBeNull();
    await scanRepo.ensureSession(db, 'scn_1', iso());
    await scanRepo.ensureSession(db, 'scn_1', iso(5)); // no-op
    const photos = [
      { id: 'ph1', uri: 'https://example.test/fridge.jpg', label: 'Fridge', retaken: false },
      { id: 'ph2', uri: 'file:///shelf.jpg', retaken: true },
    ];
    const warnings = [{ photoIndex: 1, type: 'blurry' as const, message: 'Photo 2 looks blurry' }];
    await scanRepo.savePhotos(db, 'scn_1', photos, []);
    await scanRepo.saveDetection(db, 'scn_1', MOCKUP_ITEMS, warnings);

    const expected: ScanSession = {
      id: 'scn_1',
      createdAt: iso(),
      confirmedAt: null,
      status: 'detected',
      photos,
      items: MOCKUP_ITEMS,
      warnings,
    };
    expect(await scanRepo.loadLatest(db)).toEqual(expected);

    const milk = {
      ...MOCKUP_ITEMS.find((i) => i.id === 'milk')!,
      value: 480,
      displayUnit: 'cups',
      touched: true,
    };
    await scanRepo.updateItems(db, 'scn_1', [milk]);
    const cream = {
      id: 'cream',
      name: 'Fresh cream',
      category: 'Added',
      unit: 'ml',
      min: 0,
      max: 500,
      step: 25,
      estimate: null,
      value: 200,
      displayUnit: 'ml',
      confidence: 'manual' as const,
      photoIndex: null,
      touched: true,
    };
    await scanRepo.addItem(db, 'scn_1', cream);
    await scanRepo.addItem(db, 'scn_1', { ...cream, value: 1 }); // duplicate id: ignored
    await scanRepo.removeItem(db, 'scn_1', 'lemon');
    await scanRepo.setStatus(db, 'scn_1', 'confirmed', iso(9));

    const s = await scanRepo.loadLatest(db);
    expect(s?.items.find((i) => i.id === 'milk')).toEqual(milk);
    expect(s?.items.at(-1)).toEqual(cream);
    expect(s?.items.map((i) => i.id)).not.toContain('lemon');
    expect(s).toMatchObject({ status: 'confirmed', confirmedAt: iso(9) });
  });

  it('scanRepo.loadLatest returns the newest session', async () => {
    await scanRepo.ensureSession(db, 'old', iso(-1000));
    await scanRepo.ensureSession(db, 'new', iso());
    expect((await scanRepo.loadLatest(db))?.id).toBe('new');
  });

  it('cookbookRepo: snapshots, saved order, cooked history (6 distinct, newest first)', async () => {
    const pp = recipeById('palak-paneer');
    const sh = recipeById('shakshuka');
    await cookbookRepo.save(db, sh, iso(-2000));
    await cookbookRepo.save(db, pp, iso(-1000));
    const ids = [
      'egg-fried-rice',
      'paneer-bhurji',
      'curd-rice',
      'tomato-pasta',
      'tikka-wrap',
      'shakshuka',
      'butter-chicken',
    ];
    for (const [i, id] of ids.entries()) {
      await cookbookRepo.recordCooked(db, recipeById(id), 2, iso(i * 1000));
    }
    await cookbookRepo.recordCooked(db, recipeById('egg-fried-rice'), 4, iso(99_000));

    const rows = await cookbookRepo.load(db);
    expect(rows.saved).toEqual(['palak-paneer', 'shakshuka']);
    expect(rows.cooked).toEqual([
      'egg-fried-rice',
      'butter-chicken',
      'shakshuka',
      'tikka-wrap',
      'tomato-pasta',
      'curd-rice',
    ]);
    expect(rows.snapshots['palak-paneer']).toEqual(pp);
    expect(Object.keys(rows.snapshots)).toHaveLength(8);
    expect((await cookbookRepo.history(db))[0]).toEqual({
      recipeId: 'egg-fried-rice',
      servings: 4,
      cookedAt: iso(99_000),
    });

    await cookbookRepo.unsave(db, 'palak-paneer');
    await cookbookRepo.upsertSnapshot(db, { ...sh, name: 'Shakshuka v2' }, iso());
    const after = await cookbookRepo.load(db);
    expect(after.saved).toEqual(['shakshuka']);
    expect(after.snapshots['shakshuka']?.name).toBe('Shakshuka v2');
  });
});

describe('bad rows throw a clear DbDataError', () => {
  it('corrupt JSON column', async () => {
    await profileRepo.save(db, demoUser.profile);
    await db.runAsync('UPDATE profile SET allergies = \'["Nuts",\' WHERE id = 1');
    await expect(profileRepo.get(db)).rejects.toThrow(DbDataError);
    await expect(profileRepo.get(db)).rejects.toThrow(
      /profile[\s\S]*not valid JSON[\s\S]*allergies/,
    );
  });

  it('JSON of the wrong shape and unknown enum values', async () => {
    await cookbookRepo.save(db, recipeById('curd-rice'), iso());
    await db.runAsync('UPDATE recipe_snapshots SET recipe = \'{"id":"curd-rice"}\'');
    await expect(cookbookRepo.load(db)).rejects.toThrow(/recipe_snapshots/);

    await prefsRepo.save(db, DEFAULT_PREFERENCES);
    await db.runAsync("UPDATE preferences SET sort = 'random'");
    await expect(prefsRepo.get(db)).rejects.toThrow(/preferences[\s\S]*sort/);
  });

  it('a non-numeric last_scan_items', async () => {
    await metaRepo.setLastScan(db, { at: iso(), items: 3 });
    await metaRepo.set(db, 'last_scan_items', 'lots');
    await expect(metaRepo.getLastScan(db)).rejects.toThrow(DbDataError);
  });
});

describe('foreign keys', () => {
  it('deleting a scan session cascades to its photos, items and warnings', async () => {
    await scanRepo.ensureSession(db, 'scn_1', iso());
    await scanRepo.savePhotos(
      db,
      'scn_1',
      [{ id: 'ph1', uri: 'file:///a.jpg', retaken: false }],
      [{ photoIndex: 0, type: 'dark', message: 'Photo 1 is dark' }],
    );
    await scanRepo.saveDetection(db, 'scn_1', MOCKUP_ITEMS, [
      { photoIndex: 0, type: 'dark', message: 'Photo 1 is dark' },
    ]);
    expect(await count('scan_items')).toBe(MOCKUP_ITEMS.length);
    await scanRepo.deleteSession(db, 'scn_1');
    for (const t of ['scan_sessions', 'scan_photos', 'scan_items', 'scan_warnings']) {
      expect(await count(t)).toBe(0);
    }
  });

  it('are enforced (a saved recipe needs its snapshot)', async () => {
    await expect(
      db.runAsync("INSERT INTO saved_recipes (recipe_id, saved_at) VALUES ('ghost', 'x')"),
    ).rejects.toThrow(/FOREIGN KEY/);
  });
});

describe('transactions', () => {
  it('roll back on error, and nested calls join the outer transaction', async () => {
    await expect(
      db.withTransactionAsync(async () => {
        await metaRepo.setOnboarded(db, true);
        await metaRepo.setLastScan(db, { at: iso(), items: 1 }); // nested transaction
        throw new Error('stop');
      }),
    ).rejects.toThrow('stop');
    expect(await metaRepo.get(db, 'onboarded')).toBeNull();
    expect(await metaRepo.getLastScan(db)).toBeNull();
  });

  it('reentrantTransactions only begins once', async () => {
    const calls: string[] = [];
    const inner = createNodeDriver();
    const wrapped = reentrantTransactions({
      ...inner,
      withTransactionAsync: async (task) => {
        calls.push('begin');
        await task();
      },
    });
    await wrapped.withTransactionAsync(() => wrapped.withTransactionAsync(async () => undefined));
    expect(calls).toEqual(['begin']);
    await inner.closeAsync();
  });
});

describe('bootstrap', () => {
  afterEach(() => setDatabaseForTests(null));

  it('initDatabase migrates and seeds the demo user once (mock mode)', async () => {
    const fresh = createNodeDriver();
    setDatabaseForTests(fresh);
    expect((await initDatabase({ mode: 'mock', now: NOW })).seeded).toBe(true);
    expect(await getUserVersion(fresh)).toBe(LATEST_VERSION);
    expect(await profileRepo.get(fresh)).toEqual(demoUser.profile);
    const pantry = await pantryRepo.list(fresh);
    expect(pantry.staples).toHaveLength(25);
    expect(pantry.staples[0]).toMatchObject({
      id: 'turmeric',
      level: 1,
      updatedAt: iso(-14 * 864e5),
    });
    expect(await metaRepo.getLastScan(fresh)).toEqual({ at: iso(-2 * 864e5), items: 11 });
    const cookbook = await cookbookRepo.load(fresh);
    expect(cookbook.saved).toEqual(['palak-paneer', 'shakshuka']);
    expect(cookbook.cooked).toEqual(['egg-fried-rice', 'paneer-bhurji']);

    // Second launch: the user's changes survive; nothing is reseeded.
    await profileRepo.save(fresh, { ...demoUser.profile, name: 'Changed' });
    expect((await initDatabase({ mode: 'mock', now: NOW })).seeded).toBe(false);
    expect(await seedDemoData(fresh, NOW)).toBe(false);
    expect((await profileRepo.get(fresh))?.name).toBe('Changed');
  });

  it('http mode starts empty, with catalog default staples at level 3', async () => {
    const fresh = createNodeDriver();
    setDatabaseForTests(fresh);
    await initDatabase({
      mode: 'http',
      now: NOW,
      defaultStaples: [
        {
          id: 'salt',
          name: 'Salt',
          category: 'Spices',
          unitHint: '1 kg pack',
          unit: 'tsp',
          perLevel: 20,
        },
      ],
    });
    expect((await pantryRepo.list(fresh)).staples).toEqual([
      expect.objectContaining({ id: 'salt', level: 3, updatedAt: iso() }),
    ]);
    expect((await cookbookRepo.load(fresh)).saved).toEqual([]);
    expect(await metaRepo.getLastScan(fresh)).toBeNull();
    expect(await seedDefaults(fresh)).toBe(false);
  });

  it('resetDatabase wipes every user table and reseeds', async () => {
    const fresh = createNodeDriver();
    setDatabaseForTests(fresh);
    await initDatabase({ mode: 'mock', now: NOW });
    await scanRepo.ensureSession(fresh, 'scn_x', iso());
    await metaRepo.setOnboarded(fresh, true);
    await resetRepo.clearAll(fresh);
    for (const t of resetRepo.USER_TABLES) {
      expect(await fresh.getFirstAsync(`SELECT 1 FROM ${t}`)).toBeNull();
    }
    await resetDatabase({ mode: 'mock', now: NOW });
    expect(await metaRepo.getOnboarded(fresh)).toBe(false);
    expect(await scanRepo.loadLatest(fresh)).toBeNull();
    expect((await pantryRepo.list(fresh)).staples).toHaveLength(25);
  });

  it('seedDemoData fails loudly when a saved recipe has no snapshot', async () => {
    await expect(seedDemoData(db, NOW, { ...demoUser, recipes: [] })).rejects.toThrow(
      /no snapshot for recipe "shakshuka"/,
    );
    expect(await metaRepo.getSeededAt(db)).toBeNull();
  });
});
