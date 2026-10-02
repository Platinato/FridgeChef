/** `app_meta` key/value flags: onboarding, seeding, last scan, pantry auto-include. */
import { z } from 'zod';

import type { LastScan } from '@/domain/types';

import type { SqlDriver } from '../driver';
import { parseRow } from './rows';

export type MetaKey =
  | 'onboarded'
  | 'seeded_at'
  | 'last_scan_at'
  | 'last_scan_items'
  | 'auto_include'
  | 'default_staples_checked';

const valueRow = z.object({ value: z.string() });
const intText = z.string().regex(/^\d+$/).transform(Number);

async function get(db: SqlDriver, key: MetaKey): Promise<string | null> {
  const row = await db.getFirstAsync<unknown>('SELECT value FROM app_meta WHERE key = ?', [key]);
  return row ? parseRow(valueRow, row, `app_meta (${key})`).value : null;
}

async function set(db: SqlDriver, key: MetaKey, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

async function remove(db: SqlDriver, key: MetaKey): Promise<void> {
  await db.runAsync('DELETE FROM app_meta WHERE key = ?', [key]);
}

const flag = async (db: SqlDriver, key: MetaKey, fallback: boolean): Promise<boolean> => {
  const v = await get(db, key);
  return v === null ? fallback : v === '1';
};

export const metaRepo = {
  get,
  set,
  remove,

  getOnboarded: (db: SqlDriver) => flag(db, 'onboarded', false),
  setOnboarded: (db: SqlDriver, onboarded: boolean) => set(db, 'onboarded', onboarded ? '1' : '0'),

  /** ISO time of the first-launch seed; `null` until seeded. */
  getSeededAt: (db: SqlDriver) => get(db, 'seeded_at'),
  setSeededAt: (db: SqlDriver, iso: string) => set(db, 'seeded_at', iso),

  getAutoInclude: (db: SqlDriver) => flag(db, 'auto_include', true),
  setAutoInclude: (db: SqlDriver, on: boolean) => set(db, 'auto_include', on ? '1' : '0'),

  /** Whether the catalog's default staples were offered once (http mode's empty first launch). */
  getDefaultStaplesChecked: (db: SqlDriver) => flag(db, 'default_staples_checked', false),
  setDefaultStaplesChecked: (db: SqlDriver) => set(db, 'default_staples_checked', '1'),

  async getLastScan(db: SqlDriver): Promise<LastScan | null> {
    const at = await get(db, 'last_scan_at');
    const items = await get(db, 'last_scan_items');
    if (at === null || items === null) return null;
    return { at, items: parseRow(intText, items, 'app_meta (last_scan_items)') };
  },

  async setLastScan(db: SqlDriver, lastScan: LastScan): Promise<void> {
    await db.withTransactionAsync(async () => {
      await set(db, 'last_scan_at', lastScan.at);
      await set(db, 'last_scan_items', String(lastScan.items));
    });
  },
};
