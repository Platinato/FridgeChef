/** The single `profile` row. */
import { z } from 'zod';

import type { Profile } from '@/domain/types';

import type { SqlDriver } from '../driver';
import { dietPref, effortPref, jsonColumn, parseRow, stringList, unitSystem } from './rows';

const profileRow = z
  .object({
    name: z.string(),
    diet: dietPref,
    allergies: jsonColumn(stringList),
    household_size: z.number().int().positive(),
    units: unitSystem,
    default_effort: effortPref,
  })
  .transform((r): Profile => ({
    name: r.name,
    diet: r.diet,
    allergies: r.allergies,
    householdSize: r.household_size,
    units: r.units,
    defaultEffort: r.default_effort,
  }));

export const profileRepo = {
  /** `null` before the first seed. */
  async get(db: SqlDriver): Promise<Profile | null> {
    const row = await db.getFirstAsync<unknown>(
      'SELECT name, diet, allergies, household_size, units, default_effort FROM profile WHERE id = 1',
    );
    return row ? parseRow(profileRow, row, 'profile') : null;
  },

  async save(db: SqlDriver, p: Profile, nowIso: string = new Date().toISOString()): Promise<void> {
    await db.runAsync(
      `INSERT INTO profile (id, name, diet, allergies, household_size, units, default_effort, updated_at)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
         name = excluded.name, diet = excluded.diet, allergies = excluded.allergies,
         household_size = excluded.household_size, units = excluded.units,
         default_effort = excluded.default_effort, updated_at = excluded.updated_at`,
      [
        p.name,
        p.diet,
        JSON.stringify(p.allergies),
        p.householdSize,
        p.units,
        p.defaultEffort,
        nowIso,
      ],
    );
  },
};
