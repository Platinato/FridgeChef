import { recipeSchema as domainRecipeSchema } from '@/db/repositories/rows';
import { demoUser } from '@/db/seeds/demoUser';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import {
  catalogSchema,
  detectRequestSchema,
  detectResponseSchema,
  detectedItemSchema,
  errorEnvelopeSchema,
  recipeSchema,
  suggestRequestSchema,
  suggestResponseSchema,
} from '@/services/api/contract';
import {
  toCatalog,
  toDetectRequest,
  toDetectedItem,
  toRecipe,
  toSuggestRequest,
} from '@/services/api/mappers';
import { mockRepo } from '@/services/api/mock/db/mockRepo';
import { catalogSeed } from '@/services/api/mock/db/seed/catalog';
import { demoPhotoSeed } from '@/services/api/mock/db/seed/demoPhotos';
import { detectionSeed } from '@/services/api/mock/db/seed/detections';
import { recipeSeed } from '@/services/api/mock/db/seed/recipes';
import type { NodeDriver } from '@/db/testing/nodeDriver';
import { createMockDb, detectInput, fastMockApi, suggestInput } from '@/testing/apiHelpers';
import { mockupKitchen } from '@/testing/mockupData';

let db: NodeDriver;
beforeEach(async () => {
  db = await createMockDb();
});
afterEach(() => db.closeAsync());

describe('seed DTOs pass the contract schemas', () => {
  it('catalog', () => {
    expect(catalogSchema.parse(catalogSeed)).toEqual(catalogSeed);
    expect(catalogSeed.defaultStaples).toHaveLength(25);
    expect(catalogSeed.cuisines[0]).toBe('Any');
  });

  it.each(recipeSeed.map((r) => [r.id, r] as const))('recipe %s', (_id, r) => {
    expect(recipeSchema.parse(r)).toEqual(r);
  });

  it.each(detectionSeed.map((d) => [d.id, d] as const))('detection %s', (_id, d) => {
    expect(detectedItemSchema.parse(d)).toEqual(d);
  });

  it('demo photos have ids, labels and uris', () => {
    expect(demoPhotoSeed).toHaveLength(6);
    for (const p of demoPhotoSeed) expect(p.uri).toMatch(/^https:\/\//);
  });
});

describe('rows read back from the mock database pass', () => {
  it('every table', async () => {
    expect(catalogSchema.safeParse(await mockRepo.catalog(db)).success).toBe(true);
    for (const r of await mockRepo.recipes(db))
      expect(recipeSchema.safeParse(r).success).toBe(true);
    const detections = await mockRepo.detections(db, 6);
    expect(detections).toHaveLength(12);
    for (const d of detections) expect(detectedItemSchema.safeParse(d).success).toBe(true);
  });
});

describe('MockApi output is valid domain data', () => {
  it('for every method', async () => {
    const api = fastMockApi(db);
    const catalog = await api.getCatalog();
    expect(catalog).toEqual(toCatalog(catalogSeed));

    const detection = await api.detectIngredients(detectInput(3));
    expect(detection.items).toHaveLength(12);
    expect(detection.items.every((i) => !i.touched && i.value === i.estimate)).toBe(true);

    const recipes = await api.suggestRecipes(suggestInput(mockupKitchen()));
    for (const r of recipes) expect(domainRecipeSchema.safeParse(r).success).toBe(true);

    const bc = await api.getRecipe('butter-chicken');
    expect(domainRecipeSchema.parse(bc)).toEqual(bc);
    expect(bc.image).toMatch(/^https:/);
  });
});

describe('schemas', () => {
  it('strip unknown fields and enforce required ones', () => {
    const r = recipeSeed[0]!;
    expect(recipeSchema.parse({ ...r, rating: 5 })).not.toHaveProperty('rating');
    const { name: _n, ...noName } = r;
    expect(recipeSchema.safeParse(noName).success).toBe(false);
    expect(recipeSchema.safeParse({ ...r, effort: 9 }).success).toBe(false);
    expect(recipeSchema.parse({ ...r, swaps: undefined }).swaps).toEqual([]);
  });

  it('detect response defaults photoWarnings; error envelope', () => {
    expect(detectResponseSchema.parse({ scanId: 's', items: [] }).photoWarnings).toEqual([]);
    expect(
      errorEnvelopeSchema.parse({
        error: { code: 'rate_limited', message: 'x', retryAfterSec: 20 },
      }),
    ).toEqual({ error: { code: 'rate_limited', message: 'x', retryAfterSec: 20 } });
    expect(
      detectRequestSchema.safeParse({ ...toDetectRequest(detectInput(1)), images: [] }).success,
    ).toBe(false);
    expect(detectRequestSchema.safeParse(toDetectRequest(detectInput(7))).success).toBe(false);
  });
});

describe('mappers', () => {
  it('toDetectedItem: fresh, clamped, base unit', () => {
    const milk = detectionSeed.find((d) => d.id === 'milk')!;
    expect(toDetectedItem(milk)).toMatchObject({
      value: 750,
      estimate: 750,
      displayUnit: 'ml',
      altUnit: { unit: 'cups', factor: 240, step: 0.25 },
      touched: false,
    });
    expect(toDetectedItem({ ...milk, estimate: 9999 }).value).toBe(milk.max);
    const { altUnit: _a, imageUrl: _i, ...bare } = milk;
    const item = toDetectedItem(bare);
    expect(item).not.toHaveProperty('altUnit');
    expect(item).not.toHaveProperty('imageUrl');
  });

  it('toRecipe renames imageUrl → image', () => {
    const r = toRecipe(recipeSeed[0]!);
    expect(r.image).toBe(recipeSeed[0]!.imageUrl);
    expect(r).not.toHaveProperty('imageUrl');
    const { imageUrl: _i, ...noImage } = recipeSeed[0]!;
    expect(toRecipe(noImage)).not.toHaveProperty('image');
  });

  it('the demo user snapshots equal the mapped seed recipes', () => {
    for (const snap of demoUser.recipes) {
      expect(snap).toEqual(toRecipe(recipeSeed.find((r) => r.id === snap.id)!));
    }
  });

  it('toSuggestRequest sends what the user has and the staples that count', () => {
    const kitchen = mockupKitchen();
    kitchen.items = kitchen.items.map((i) => (i.id === 'lemon' ? { ...i, value: 0 } : i));
    kitchen.excluded = { salt: true };
    kitchen.staples = kitchen.staples.map((s) => (s.id === 'honey' ? { ...s, level: 0 } : s));
    const req = toSuggestRequest({ ...suggestInput(kitchen), profile: { allergies: ['Nuts'] } });
    expect(suggestRequestSchema.parse(req)).toEqual(req);
    expect(req.ingredients.map((i) => i.id)).not.toContain('lemon');
    expect(req.ingredients.find((i) => i.id === 'chicken')).toEqual({
      id: 'chicken',
      name: 'Chicken breast',
      quantity: 500,
      unit: 'g',
    });
    expect(req.staples.map((s) => s.id)).not.toContain('salt');
    expect(req.staples.map((s) => s.id)).not.toContain('honey');
    expect(req.staples).toHaveLength(23);
    expect(req.preferences).toMatchObject({
      allergies: ['Nuts'],
      timeMin: DEFAULT_PREFERENCES.timeMin,
    });
    expect(req.limit).toBe(12);
    expect(
      toSuggestRequest({ ...suggestInput({ ...kitchen, autoInclude: false }) }).staples,
    ).toEqual([]);
  });

  it('toDetectRequest renames base64 → data', () => {
    expect(toDetectRequest(detectInput(1)).images[0]).toEqual({
      id: 'ph1',
      mimeType: 'image/jpeg',
      data: 'AAAA',
    });
  });

  it('suggest responses parse', () => {
    expect(suggestResponseSchema.parse({ recipes: recipeSeed }).recipes).toHaveLength(10);
  });
});
