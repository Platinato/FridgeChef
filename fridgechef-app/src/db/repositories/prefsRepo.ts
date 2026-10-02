/** The single `preferences` row (last Mood screen choices + Suggestions filter / sort). */
import { z } from 'zod';

import type { Preferences } from '@/domain/types';

import type { SqlDriver } from '../driver';
import {
  dietPref,
  effortPref,
  filterId,
  hunger,
  jsonColumn,
  parseRow,
  sortId,
  stringList,
} from './rows';

const prefsRow = z
  .object({
    mood: z.string(),
    time_min: z.number().int().positive(),
    effort: effortPref,
    servings: z.number().int().positive(),
    hunger,
    cuisines: jsonColumn(stringList.min(1)),
    diet: dietPref,
    equipment: jsonColumn(stringList),
    spice: z.number().int(),
    filter: filterId,
    sort: sortId,
  })
  .transform((r): Preferences => ({
    mood: r.mood,
    timeMin: r.time_min,
    effort: r.effort,
    servings: r.servings,
    hunger: r.hunger,
    cuisines: r.cuisines,
    diet: r.diet,
    equipment: r.equipment,
    spice: r.spice,
    filter: r.filter,
    sort: r.sort,
  }));

export const prefsRepo = {
  /** `null` before the first seed. */
  async get(db: SqlDriver): Promise<Preferences | null> {
    const row = await db.getFirstAsync<unknown>(
      `SELECT mood, time_min, effort, servings, hunger, cuisines, diet, equipment, spice, filter, sort
       FROM preferences WHERE id = 1`,
    );
    return row ? parseRow(prefsRow, row, 'preferences') : null;
  },

  async save(
    db: SqlDriver,
    p: Preferences,
    nowIso: string = new Date().toISOString(),
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO preferences
         (id, mood, time_min, effort, servings, hunger, cuisines, diet, equipment, spice, filter, sort, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         mood = excluded.mood, time_min = excluded.time_min, effort = excluded.effort,
         servings = excluded.servings, hunger = excluded.hunger, cuisines = excluded.cuisines,
         diet = excluded.diet, equipment = excluded.equipment, spice = excluded.spice,
         filter = excluded.filter, sort = excluded.sort, updated_at = excluded.updated_at`,
      [
        p.mood,
        p.timeMin,
        p.effort,
        p.servings,
        p.hunger,
        JSON.stringify(p.cuisines),
        p.diet,
        JSON.stringify(p.equipment),
        p.spice,
        p.filter,
        p.sort,
        nowIso,
      ],
    );
  },
};
