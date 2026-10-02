/**
 * On-device state: Zustand stores over the SQLite repositories. Boot order (Sprint 06):
 * `await initDatabase()` (db/bootstrap) → `await hydrateStores()` → hide the splash.
 */
import { resetDatabase, type SeedOptions } from '@/db/bootstrap';

import { appStores, hydrateStores } from './appStores';
import { enqueue } from './persist';
import type { AppStores } from './types';

export { appStores, createAppStores, hydrateStores } from './appStores';

/**
 * Profile → "Reset demo data": waits for queued writes, wipes user data in one transaction,
 * reseeds as on first launch (demo user in mock mode), then re-hydrates the stores.
 */
export async function resetAll(
  stores: AppStores = appStores,
  opts: SeedOptions = {},
): Promise<void> {
  await enqueue(() => resetDatabase(opts));
  await hydrateStores(stores);
}

export { bootApp, bootErrorKind, type BootErrorKind } from './boot';
export { flushWrites, setWriteErrorReporter } from './persist';
export { selectPreferences } from './prefsStore';
export type { CookbookState } from './cookbookStore';
export type { PantryState } from './pantryStore';
export type { PrefsState } from './prefsStore';
export type { ProfileState } from './profileStore';
export type { NewPhoto, ScanState } from './scanStore';
export type { AppStores } from './types';
export * from './selectors';
export * from './hooks';
