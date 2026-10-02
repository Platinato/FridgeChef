/**
 * Opens `fridgechef-mock.db` on the device. Called ONLY in mock mode, lazily, by `getApi()`;
 * http mode never opens it (tested in `services/api/__tests__/factory.test.ts`).
 */
import { openDatabaseByName } from '@/db/client';
import type { SqlDriver } from '@/db/driver';

import { mockRepo } from './mockRepo';
import { MOCK_DB_NAME, prepareMockDatabase } from './schema';

let opening: Promise<SqlDriver> | null = null;

/** Opens + migrates (+ seeds on first open) the mock database once; later calls share it. */
export function openMockDatabase(): Promise<SqlDriver> {
  opening ??= (async () => {
    const db = await openDatabaseByName(MOCK_DB_NAME);
    await prepareMockDatabase(db);
    return db;
  })().catch((err: unknown) => {
    opening = null;
    throw err;
  });
  return opening;
}

/** Restores the seed (dev menu / tests). User data in fridgechef.db is untouched. */
export async function resetMockDatabase(): Promise<void> {
  await mockRepo.reseed(await openMockDatabase());
}

/** Tests: forget the cached connection. */
export function resetMockDatabaseForTests(): void {
  opening = null;
}
