/**
 * The wire format (sprints/reference/api-contract.md, v1) as Zod schemas + inferred DTO types.
 * One of the three files that know the wire format (with `mappers.ts` and `http/endpoints.ts`).
 * Unknown extra fields are stripped; required fields are enforced.
 */
import { z } from 'zod';

const nonNegative = z.number().min(0);
const level1to5 = z.number().int().min(1).max(5);

// ---------- Errors ----------

export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    retryAfterSec: z.number().min(0).optional(),
  }),
});
export type ErrorEnvelopeDto = z.infer<typeof errorEnvelopeSchema>;

// ---------- GET /v1/catalog ----------

export const catalogSchema = z.object({
  moods: z.array(z.object({ id: z.string(), label: z.string(), icon: z.string() })),
  cuisines: z.array(z.string()),
  diets: z.array(z.object({ id: z.string(), label: z.string() })),
  allergies: z.array(z.string()),
  equipment: z.array(z.object({ id: z.string(), label: z.string() })),
  addableItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      unit: z.string(),
      min: z.number(),
      max: z.number(),
      step: z.number().positive(),
      defaultValue: z.number(),
    }),
  ),
  stapleSuggestions: z.array(z.object({ name: z.string(), category: z.string() })),
  defaultStaples: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      unitHint: z.string(),
      unit: z.string(),
      perLevel: z.number().positive(),
    }),
  ),
});
export type CatalogDto = z.infer<typeof catalogSchema>;

// ---------- POST /v1/scans/detect ----------

export const MAX_DETECT_IMAGES = 6;

export const detectRequestSchema = z.object({
  images: z
    .array(
      z.object({
        id: z.string(),
        mimeType: z.string(),
        /** Base64 without a `data:` prefix. */
        data: z.string().min(1),
      }),
    )
    .min(1)
    .max(MAX_DETECT_IMAGES),
  knownStapleIds: z.array(z.string()),
  locale: z.string(),
  units: z.enum(['metric', 'imperial']),
});
export type DetectRequestDto = z.infer<typeof detectRequestSchema>;

export const altUnitSchema = z.object({
  unit: z.string(),
  /** How many base `unit` are in one alt unit (240 ml per cup). */
  factor: z.number().positive(),
  step: z.number().positive(),
});

export const detectedItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  unit: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number().positive(),
  estimate: z.number(),
  confidence: z.enum(['high', 'med', 'low']),
  photoIndex: z.number().int().min(0),
  altUnit: altUnitSchema.optional(),
  imageUrl: z.string().optional(),
});
export type DetectedItemDto = z.infer<typeof detectedItemSchema>;

export const photoWarningSchema = z.object({
  photoIndex: z.number().int().min(0),
  type: z.enum(['blurry', 'dark', 'no_food']),
  message: z.string(),
});
export type PhotoWarningDto = z.infer<typeof photoWarningSchema>;

export const detectResponseSchema = z.object({
  scanId: z.string(),
  items: z.array(detectedItemSchema),
  photoWarnings: z.array(photoWarningSchema).default([]),
});
export type DetectResponseDto = z.infer<typeof detectResponseSchema>;

// ---------- Recipe ----------

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  subtitle: z.string(),
  cuisine: z.string(),
  diet: z.enum(['nonveg', 'egg', 'veg', 'vegan']),
  timeMin: nonNegative,
  effort: level1to5,
  spice: level1to5,
  servings: z.number().positive(),
  nutrition: z.object({
    kcal: nonNegative,
    protein: nonNegative,
    carbs: nonNegative,
    fat: nonNegative,
  }),
  moods: z.array(z.string()),
  equipment: z.array(z.string()),
  onePan: z.boolean(),
  imageUrl: z.string().optional(),
  ingredients: z.array(
    z.object({ id: z.string(), name: z.string(), qty: nonNegative, unit: z.string() }),
  ),
  steps: z.array(z.object({ text: z.string(), minutes: nonNegative })),
  swaps: z.array(z.object({ missing: z.string(), use: z.string() })).default([]),
});
export type RecipeDto = z.infer<typeof recipeSchema>;

// ---------- POST /v1/recipes/suggest ----------

export const suggestRequestSchema = z.object({
  ingredients: z.array(
    z.object({ id: z.string(), name: z.string(), quantity: nonNegative, unit: z.string() }),
  ),
  staples: z.array(z.object({ id: z.string(), name: z.string(), level: z.number().min(0).max(5) })),
  preferences: z.object({
    mood: z.string(),
    timeMin: z.number().positive(),
    effort: z.enum(['minimal', 'moderate', 'chef']),
    servings: z.number().int().positive(),
    hunger: z.enum(['snack', 'meal', 'starving']),
    cuisines: z.array(z.string()).min(1),
    diet: z.enum(['none', 'veg', 'vegan', 'egg', 'keto', 'protein', 'jain']),
    allergies: z.array(z.string()),
    equipment: z.array(z.string()),
    spice: level1to5,
  }),
  limit: z.number().int().positive(),
});
export type SuggestRequestDto = z.infer<typeof suggestRequestSchema>;

export const suggestResponseSchema = z.object({ recipes: z.array(recipeSchema) });
export type SuggestResponseDto = z.infer<typeof suggestResponseSchema>;

// ---------- GET /v1/recipes/{id} ----------

export const recipeResponseSchema = recipeSchema;
export type RecipeResponseDto = RecipeDto;
