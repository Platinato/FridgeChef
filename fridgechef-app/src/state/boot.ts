/**
 * App boot (Sprint 06): open + migrate + first-launch seed (`initDatabase`), then load every
 * store from SQLite. The root layout keeps the splash up until this resolves; a rejection shows
 * the boot error screen with "Try again", which simply calls this again.
 */
import { initDatabase } from '@/db/bootstrap';
import { MigrationError } from '@/db/migrate';

import { appStores, hydrateStores } from './appStores';
import type { AppStores } from './types';

/** Why a boot failed, for the error screen's copy: an outdated app, or anything else. */
export type BootErrorKind = 'app_outdated' | 'unknown';

export const bootErrorKind = (error: unknown): BootErrorKind =>
  error instanceof MigrationError && error.code === 'newer' ? 'app_outdated' : 'unknown';

export async function bootApp(stores: AppStores = appStores): Promise<void> {
  await initDatabase();
  await hydrateStores(stores);
}
