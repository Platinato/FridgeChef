/**
 * Boot API for the user database. The root layout calls `initDatabase()` behind the splash, then
 * `hydrateStores()` (Sprint 06). Sprint 05 adds opening + seeding `fridgechef-mock.db` in mock mode.
 */
import { daysAgo } from '@/domain/format';
import { DEFAULT_PREFERENCES, DEFAULT_PROFILE } from '@/domain/preferences';
import type { DefaultStaple, Staple } from '@/domain/types';
import { config, type ApiMode } from '@/services/config';

import { openAppDatabase } from './client';
import type { SqlDriver } from './driver';
import { migrate } from './migrate';
import { migrations } from './migrations';
import {
  cookbookRepo,
  metaRepo,
  pantryRepo,
  prefsRepo,
  profileRepo,
  resetRepo,
} from './repositories';
import { demoUser, resolveStaples, type DemoUserSeed } from './seeds/demoUser';

/** New staples in http mode start at 3 bars. */
export const DEFAULT_STAPLE_LEVEL = 3;

export type SeedOptions = {
  /** Which first-launch state to apply. Default: `config.API_MODE`. */
  mode?: ApiMode;
  /** "Now" for resolving the seed's relative times (ms). Default: `Date.now()`. */
  now?: number;
  /** http mode: the catalog's `defaultStaples`, when already known. */
  defaultStaples?: DefaultStaple[];
};

/**
 * Applies the mockup's demo starting state in one transaction. Runs once: does nothing (and
 * returns false) when the database was already seeded.
 */
export async function seedDemoData(
  db: SqlDriver,
  now: number = Date.now(),
  seed: DemoUserSeed = demoUser,
): Promise<boolean> {
  let applied = false;
  await db.withTransactionAsync(async () => {
    if (await metaRepo.getSeededAt(db)) return;
    const nowIso = new Date(now).toISOString();
    await profileRepo.save(db, seed.profile, nowIso);
    await prefsRepo.save(db, seed.preferences, nowIso);
    await pantryRepo.replaceAll(db, resolveStaples(seed.staples, now), seed.excluded);
    await metaRepo.setAutoInclude(db, seed.autoInclude);
    await metaRepo.setOnboarded(db, seed.onboarded);
    await metaRepo.setLastScan(db, {
      at: daysAgo(seed.lastScan.daysAgo, now),
      items: seed.lastScan.items,
    });

    const recipe = (id: string) => {
      const r = seed.recipes.find((x) => x.id === id);
      if (!r) throw new Error(`Demo seed has no snapshot for recipe "${id}"`);
      return r;
    };
    // Oldest first, so ties on time still read newest-first.
    for (const s of seed.saved.slice().reverse()) {
      await cookbookRepo.save(db, recipe(s.recipeId), daysAgo(s.savedDaysAgo, now));
    }
    for (const c of seed.cooked.slice().reverse()) {
      await cookbookRepo.recordCooked(
        db,
        recipe(c.recipeId),
        c.servings,
        daysAgo(c.cookedDaysAgo, now),
      );
    }
    await metaRepo.setSeededAt(db, nowIso);
    applied = true;
  });
  return applied;
}

/**
 * http mode's first-launch state: default profile + preferences, and the catalog's default
 * staples at 3 bars when known. Runs once, like `seedDemoData`.
 */
export async function seedDefaults(
  db: SqlDriver,
  { now = Date.now(), defaultStaples = [] }: Pick<SeedOptions, 'now' | 'defaultStaples'> = {},
): Promise<boolean> {
  let applied = false;
  await db.withTransactionAsync(async () => {
    if (await metaRepo.getSeededAt(db)) return;
    const nowIso = new Date(now).toISOString();
    const staples: Staple[] = defaultStaples.map((s) => ({
      ...s,
      level: DEFAULT_STAPLE_LEVEL,
      updatedAt: nowIso,
    }));
    await profileRepo.save(db, DEFAULT_PROFILE, nowIso);
    await prefsRepo.save(db, DEFAULT_PREFERENCES, nowIso);
    await pantryRepo.replaceAll(db, staples);
    await metaRepo.setAutoInclude(db, true);
    await metaRepo.setOnboarded(db, false);
    await metaRepo.setSeededAt(db, nowIso);
    applied = true;
  });
  return applied;
}

const seedFor = (db: SqlDriver, opts: SeedOptions) =>
  (opts.mode ?? config.API_MODE) === 'mock'
    ? seedDemoData(db, opts.now)
    : seedDefaults(db, { now: opts.now, defaultStaples: opts.defaultStaples });

/**
 * Opens `fridgechef.db`, runs its migrations, and applies the first-launch state once
 * (`app_meta.seeded_at` unset): the demo user in mock mode, defaults in http mode.
 */
export async function initDatabase(
  opts: SeedOptions = {},
): Promise<{ db: SqlDriver; seeded: boolean }> {
  const db = await openAppDatabase();
  await migrate(db, migrations);
  const seeded = await seedFor(db, opts);
  return { db, seeded };
}

/**
 * Deletes all user data in one transaction (clearing `seeded_at`), then reseeds as on first
 * launch. `resetAll()` in `src/state` calls this and then re-hydrates the stores.
 */
export async function resetDatabase(opts: SeedOptions = {}): Promise<void> {
  const db = await openAppDatabase();
  await resetRepo.clearAll(db);
  await seedFor(db, opts);
}
