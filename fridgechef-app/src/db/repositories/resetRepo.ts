/** Wipes user data (Profile → "Reset demo data"). The schema and `user_version` stay. */
import type { SqlDriver } from '../driver';

/** Child tables first, so the delete order never depends on foreign-key cascades. */
const USER_TABLES = [
  'cooked_history',
  'saved_recipes',
  'recipe_snapshots',
  'scan_warnings',
  'scan_items',
  'scan_photos',
  'scan_sessions',
  'staples',
  'preferences',
  'profile',
  'app_meta',
] as const;

export const resetRepo = {
  USER_TABLES,

  /** Deletes every user row, including `seeded_at`, in one transaction. */
  async clearAll(db: SqlDriver): Promise<void> {
    await db.withTransactionAsync(async () => {
      // Table names come from the constant above, never from input.
      for (const table of USER_TABLES) await db.runAsync(`DELETE FROM ${table}`);
    });
  },
};
