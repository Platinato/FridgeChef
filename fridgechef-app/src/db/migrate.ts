/** Schema migrations tracked with `PRAGMA user_version`. Reused by Sprint 05 for the mock database. */
import type { SqlDriver } from './driver';

export type Migration = {
  /** 1, 2, 3 … in order, no gaps. */
  version: number;
  name: string;
  up: (db: SqlDriver) => Promise<void>;
};

/** `newer`: the database was written by a newer app (refused untouched). `order`: a bad migration list. */
export type MigrationErrorCode = 'newer' | 'order';

export class MigrationError extends Error {
  override name = 'MigrationError';
  constructor(
    message: string,
    readonly code: MigrationErrorCode = 'order',
  ) {
    super(message);
  }
}

export async function getUserVersion(db: SqlDriver): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

function checkOrder(migrations: readonly Migration[]): void {
  migrations.forEach((m, i) => {
    if (m.version !== i + 1) {
      throw new MigrationError(
        `Migration "${m.name}" has version ${m.version}; expected ${i + 1} (versions must be 1..n in order).`,
      );
    }
  });
}

/**
 * Runs every migration newer than the database, in order, each in its own transaction, and bumps
 * `user_version` inside that transaction. Refuses a database newer than the app knows about
 * rather than guessing (no data is touched). Returns the versions before and after.
 */
export async function migrate(
  db: SqlDriver,
  migrations: readonly Migration[],
): Promise<{ from: number; to: number }> {
  checkOrder(migrations);
  const latest = migrations.length;
  const from = await getUserVersion(db);
  if (from > latest) {
    throw new MigrationError(
      `This database is at schema version ${from}, but this app only knows up to ${latest}. Update the app to open it.`,
      'newer',
    );
  }
  for (const m of migrations.slice(from)) {
    await db.withTransactionAsync(async () => {
      await m.up(db);
      // PRAGMA can't take a bound parameter; `version` is a checked integer.
      await db.execAsync(`PRAGMA user_version = ${Math.trunc(m.version)}`);
    });
  }
  return { from, to: latest };
}
