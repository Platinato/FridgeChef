/**
 * `fridgechef-mock.db`: the stand-in backend's tables + the seeding migration, run with the same
 * `migrate()` as the user database. Each row keeps a few lookup columns and the full wire DTO in
 * `dto`. No expo-sqlite here, so the smoke script can use it on the Node driver.
 */
import type { SqlDriver } from '@/db/driver';
import { migrate, type Migration } from '@/db/migrate';

import { catalogSeed } from './seed/catalog';
import { demoPhotoSeed } from './seed/demoPhotos';
import { detectionSeed } from './seed/detections';
import { recipeSeed } from './seed/recipes';

export const MOCK_DB_NAME = 'fridgechef-mock.db';

/** Inserts every seed module (the caller wraps this in a transaction). */
export async function insertSeed(db: SqlDriver): Promise<void> {
  await db.runAsync('INSERT INTO mock_catalog (id, dto) VALUES (1, ?)', [
    JSON.stringify(catalogSeed),
  ]);
  for (const [i, d] of detectionSeed.entries()) {
    await db.runAsync(
      'INSERT INTO mock_detections (id, photo_index, sort_order, dto) VALUES (?, ?, ?, ?)',
      [d.id, d.photoIndex, i, JSON.stringify(d)],
    );
  }
  for (const [i, r] of recipeSeed.entries()) {
    await db.runAsync('INSERT INTO mock_recipes (id, sort_order, dto) VALUES (?, ?, ?)', [
      r.id,
      i,
      JSON.stringify(r),
    ]);
  }
  for (const [i, p] of demoPhotoSeed.entries()) {
    await db.runAsync('INSERT INTO mock_demo_photos (id, sort_order, dto) VALUES (?, ?, ?)', [
      p.id,
      i,
      JSON.stringify(p),
    ]);
  }
}

/** Append-only, like the user database's migrations. */
export const mockMigrations: readonly Migration[] = [
  {
    version: 1,
    name: '0001_mock_schema',
    up: (db) =>
      db.execAsync(`
        CREATE TABLE mock_catalog (
          id  INTEGER PRIMARY KEY CHECK (id = 1),
          dto TEXT NOT NULL
        );
        CREATE TABLE mock_detections (
          id          TEXT PRIMARY KEY NOT NULL,
          photo_index INTEGER NOT NULL,
          sort_order  INTEGER NOT NULL,
          dto         TEXT NOT NULL
        );
        CREATE INDEX mock_detections_by_photo ON mock_detections (photo_index, sort_order);
        CREATE TABLE mock_recipes (
          id         TEXT PRIMARY KEY NOT NULL,
          sort_order INTEGER NOT NULL,
          dto        TEXT NOT NULL
        );
        CREATE TABLE mock_demo_photos (
          id         TEXT PRIMARY KEY NOT NULL,
          sort_order INTEGER NOT NULL,
          dto        TEXT NOT NULL
        );
      `),
  },
  { version: 2, name: '0002_mock_seed', up: insertSeed },
];

/** Migrates (and on first open, seeds) a mock database. Idempotent. */
export const prepareMockDatabase = (db: SqlDriver) => migrate(db, mockMigrations);
