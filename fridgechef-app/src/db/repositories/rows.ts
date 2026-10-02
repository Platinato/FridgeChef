/** Row parsing shared by the repositories: every row is Zod-checked, so nothing leaves as `any`. */
import { z } from 'zod';

import type { Recipe } from '@/domain/types';

/** A row that doesn't match the schema (corrupt JSON, bad enum, wrong type). */
export class DbDataError extends Error {
  override name = 'DbDataError';
}

/** Parses a row (or throws a DbDataError naming the table and what was wrong). */
export function parseRow<S extends z.ZodType>(schema: S, row: unknown, where: string): z.output<S> {
  const result = schema.safeParse(row);
  if (!result.success) {
    throw new DbDataError(`Unreadable row in ${where}:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

/** A TEXT column holding JSON, validated with `schema` after parsing. */
export const jsonColumn = <S extends z.ZodType>(schema: S) =>
  z
    .string()
    .transform((text, ctx) => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: 'not valid JSON' });
        return z.NEVER;
      }
    })
    .pipe(schema);

/** INTEGER 0 / 1 → boolean. */
export const boolColumn = z.union([z.literal(0), z.literal(1)]).transform((v) => v === 1);
export const toSqlBool = (v: boolean): number => (v ? 1 : 0);

// ---------- Domain enums and JSON shapes ----------

export const dietPref = z.enum(['none', 'veg', 'vegan', 'egg', 'keto', 'protein', 'jain']);
export const effortPref = z.enum(['minimal', 'moderate', 'chef']);
export const hunger = z.enum(['snack', 'meal', 'starving']);
export const unitSystem = z.enum(['metric', 'imperial']);
export const filterId = z.enum(['all', 'everything', 'quick', 'onepan', 'protein']);
export const sortId = z.enum(['best', 'quick', 'effort', 'protein']);
export const itemConfidence = z.enum(['high', 'med', 'low', 'manual']);
export const photoWarningType = z.enum(['blurry', 'dark', 'no_food']);
export const scanStatus = z.enum(['draft', 'detected', 'confirmed']);

export const stringList = z.array(z.string());
export const altUnit = z.object({
  unit: z.string(),
  factor: z.number().positive(),
  step: z.number().positive(),
});

export const recipeSchema: z.ZodType<Recipe> = z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string(),
  cuisine: z.string(),
  diet: z.enum(['nonveg', 'egg', 'veg', 'vegan']),
  timeMin: z.number(),
  effort: z.number(),
  spice: z.number(),
  servings: z.number().positive(),
  nutrition: z.object({
    kcal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  moods: stringList,
  equipment: stringList,
  onePan: z.boolean(),
  image: z.string().optional(),
  ingredients: z.array(
    z.object({ id: z.string(), name: z.string(), qty: z.number(), unit: z.string() }),
  ),
  steps: z.array(z.object({ text: z.string(), minutes: z.number() })),
  swaps: z.array(z.object({ missing: z.string(), use: z.string() })),
});
