/** Pantry staples (`staples`). `included = 0` is the store's `excluded[id] = true`. */
import { z } from 'zod';

import type { Staple } from '@/domain/types';

import type { SqlDriver } from '../driver';
import { boolColumn, parseRow, toSqlBool } from './rows';

const stapleRow = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  unit: z.string(),
  unit_hint: z.string(),
  per_level: z.number().positive(),
  level: z.number().min(0).max(5),
  included: boolColumn,
  updated_at: z.string(),
});

export type PantryRows = { staples: Staple[]; excluded: Record<string, boolean> };

const INSERT = `INSERT INTO staples
  (id, name, category, unit, unit_hint, per_level, level, included, updated_at, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const stapleParams = (s: Staple, included: boolean, sortOrder: number) =>
  [
    s.id,
    s.name,
    s.category,
    s.unit,
    s.unitHint,
    s.perLevel,
    s.level,
    toSqlBool(included),
    s.updatedAt,
    sortOrder,
  ] as const;

export const pantryRepo = {
  /** All staples in their saved order, plus which ones are switched off. */
  async list(db: SqlDriver): Promise<PantryRows> {
    const rows = await db.getAllAsync<unknown>(
      `SELECT id, name, category, unit, unit_hint, per_level, level, included, updated_at
       FROM staples ORDER BY sort_order, id`,
    );
    const excluded: Record<string, boolean> = {};
    const staples = rows.map((row) => {
      const r = parseRow(stapleRow, row, 'staples');
      if (!r.included) excluded[r.id] = true;
      return {
        id: r.id,
        name: r.name,
        category: r.category,
        unit: r.unit,
        unitHint: r.unit_hint,
        perLevel: r.per_level,
        level: r.level,
        updatedAt: r.updated_at,
      };
    });
    return { staples, excluded };
  },

  /** Adds a staple at the end of the list (no-op if the id exists). Returns whether it was added. */
  async add(db: SqlDriver, s: Staple): Promise<boolean> {
    const r = await db.runAsync(
      `INSERT INTO staples
         (id, name, category, unit, unit_hint, per_level, level, included, updated_at, sort_order)
       SELECT ?, ?, ?, ?, ?, ?, ?, 1, ?, COALESCE(MAX(sort_order), -1) + 1 FROM staples WHERE true
       ON CONFLICT (id) DO NOTHING`,
      [s.id, s.name, s.category, s.unit, s.unitHint, s.perLevel, s.level, s.updatedAt],
    );
    return r.changes > 0;
  },

  /** Writes the level + updatedAt of each staple (one transaction). */
  async saveLevels(
    db: SqlDriver,
    staples: Pick<Staple, 'id' | 'level' | 'updatedAt'>[],
  ): Promise<void> {
    await db.withTransactionAsync(async () => {
      for (const s of staples) {
        await db.runAsync('UPDATE staples SET level = ?, updated_at = ? WHERE id = ?', [
          s.level,
          s.updatedAt,
          s.id,
        ]);
      }
    });
  },

  async setIncluded(db: SqlDriver, id: string, included: boolean): Promise<void> {
    await db.runAsync('UPDATE staples SET included = ? WHERE id = ?', [toSqlBool(included), id]);
  },

  async remove(db: SqlDriver, id: string): Promise<void> {
    await db.runAsync('DELETE FROM staples WHERE id = ?', [id]);
  },

  /** Replaces the whole pantry (seed / reset), keeping the given order. */
  async replaceAll(
    db: SqlDriver,
    staples: Staple[],
    excluded: Record<string, boolean> = {},
  ): Promise<void> {
    await db.withTransactionAsync(async () => {
      await db.runAsync('DELETE FROM staples');
      for (const [i, s] of staples.entries()) {
        await db.runAsync(INSERT, stapleParams(s, !excluded[s.id], i));
      }
    });
  },
};
