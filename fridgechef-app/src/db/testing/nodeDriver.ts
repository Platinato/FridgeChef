/// <reference types="node" />
/**
 * SqlDriver on Node's built-in `node:sqlite` (Node 24+), for Jest and Node scripts
 * (`scripts/api-smoke.ts`, Sprint 05). NEVER imported by app code: Metro can't bundle `node:sqlite`.
 */
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

import { reentrantTransactions, type SqlDriver, type SqlParams } from '../driver';

export type NodeDriver = SqlDriver & {
  /** The underlying database, for tests that need to poke at raw rows. */
  raw: DatabaseSync;
};

const bind = (params: SqlParams = []): SQLInputValue[] => [...params];

/** Opens `path` (default an in-memory database) with foreign keys on, like the app client. */
export function createNodeDriver(path = ':memory:'): NodeDriver {
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  if (path !== ':memory:') db.exec('PRAGMA journal_mode = WAL');

  const driver = reentrantTransactions({
    execAsync: async (source) => {
      db.exec(source);
    },
    runAsync: async (source, params) => {
      const r = db.prepare(source).run(...bind(params));
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    // node:sqlite rows have a null prototype; copy them into plain objects like expo-sqlite returns.
    getAllAsync: async <T>(source: string, params?: SqlParams) =>
      db
        .prepare(source)
        .all(...bind(params))
        .map((row) => ({ ...row }) as T),
    getFirstAsync: async <T>(source: string, params?: SqlParams) => {
      const row = db.prepare(source).get(...bind(params));
      return row ? ({ ...row } as T) : null;
    },
    withTransactionAsync: async (task) => {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },
    closeAsync: async () => {
      db.close();
    },
  });
  return { ...driver, raw: db };
}
