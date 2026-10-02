/**
 * Opens the on-device databases. THE ONLY FILE THAT IMPORTS `expo-sqlite`
 * (enforced by `src/__tests__/architecture-rules.test.ts`). Everything else uses `SqlDriver`.
 */
import * as SQLite from 'expo-sqlite';

import { reentrantTransactions, type SqlDriver } from './driver';

export const APP_DB_NAME = 'fridgechef.db';

let appDb: SqlDriver | null = null;
let opening: Promise<SqlDriver> | null = null;

function adapt(db: SQLite.SQLiteDatabase): SqlDriver {
  return reentrantTransactions({
    execAsync: (source) => db.execAsync(source),
    runAsync: (source, params = []) => db.runAsync(source, [...params]),
    getAllAsync: (source, params = []) => db.getAllAsync(source, [...params]),
    getFirstAsync: (source, params = []) => db.getFirstAsync(source, [...params]),
    withTransactionAsync: (task) => db.withTransactionAsync(task),
    closeAsync: () => db.closeAsync(),
  });
}

/** Opens a database in the default directory with WAL + foreign keys on. Sprint 05 uses it for `fridgechef-mock.db`. */
export async function openDatabaseByName(name: string): Promise<SqlDriver> {
  const db = await SQLite.openDatabaseAsync(name);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return adapt(db);
}

/** Opens `fridgechef.db` once; later calls (and concurrent ones) get the same driver. */
export function openAppDatabase(): Promise<SqlDriver> {
  if (appDb) return Promise.resolve(appDb);
  opening ??= openDatabaseByName(APP_DB_NAME).then(
    (db) => {
      appDb = db;
      return db;
    },
    (err: unknown) => {
      opening = null;
      throw err;
    },
  );
  return opening;
}

/** The open user database. Throws until `initDatabase()` (or a test) has opened one. */
export function getDb(): SqlDriver {
  if (!appDb) throw new Error('The database is not open yet: call initDatabase() first.');
  return appDb;
}

/** Tests: use this driver (e.g. `createNodeDriver()`) as the user database; `null` clears it. */
export function setDatabaseForTests(driver: SqlDriver | null): void {
  appDb = driver;
  opening = null;
}
