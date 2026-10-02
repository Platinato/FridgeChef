/**
 * The SqlDriver port: the subset of expo-sqlite's `SQLiteDatabase` the app uses, with the same
 * method names and shapes. `client.ts` adapts expo-sqlite to it; `testing/nodeDriver.ts` adapts
 * `node:sqlite` for Jest and scripts. Nothing else knows which one is underneath.
 */

/** A bound parameter. Booleans are stored as 0 / 1 by the repositories (node:sqlite rejects them). */
export type SqlValue = string | number | null | Uint8Array;

/** Positional (`?`) parameters only: the one binding form both drivers share exactly. */
export type SqlParams = readonly SqlValue[];

export type SqlRunResult = { lastInsertRowId: number; changes: number };

export interface SqlDriver {
  /** Runs one or more statements with no parameters (DDL, PRAGMA). */
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SqlParams): Promise<SqlRunResult>;
  getAllAsync<T>(source: string, params?: SqlParams): Promise<T[]>;
  getFirstAsync<T>(source: string, params?: SqlParams): Promise<T | null>;
  /** Commits when `task` resolves, rolls back when it throws. Nested calls join the outer one. */
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

/**
 * Makes `withTransactionAsync` re-entrant: a call inside a running transaction just runs its task
 * as part of the outer transaction (SQLite has no nested BEGIN). A throw anywhere rolls back the
 * whole outer transaction. Both adapters wrap themselves with this so repositories can use a
 * transaction for a multi-row write and still be composed into a bigger one (seed, reset).
 *
 * expo-sqlite includes *every* statement that runs while a transaction is open, even ones from
 * outside the task; the stores serialise their writes (`state/persist.ts`) so nothing interleaves.
 */
export function reentrantTransactions(driver: SqlDriver): SqlDriver {
  let depth = 0;
  return {
    execAsync: (source) => driver.execAsync(source),
    runAsync: (source, params) => driver.runAsync(source, params),
    getAllAsync: (source, params) => driver.getAllAsync(source, params),
    getFirstAsync: (source, params) => driver.getFirstAsync(source, params),
    closeAsync: () => driver.closeAsync(),
    async withTransactionAsync(task) {
      if (depth > 0) {
        depth += 1;
        try {
          await task();
        } finally {
          depth -= 1;
        }
        return;
      }
      depth = 1;
      try {
        await driver.withTransactionAsync(task);
      } finally {
        depth = 0;
      }
    },
  };
}
