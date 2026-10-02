/// <reference types="node" />
/**
 * API smoke test: `npm run api:smoke` (= node --env-file-if-exists=.env --import tsx scripts/api-smoke.ts).
 *
 * Calls all four endpoints with the configured env and prints pass / fail per call (with Zod issues).
 * - http mode: through HttpApi against EXPO_PUBLIC_API_BASE_URL (Sprint 10's go-live check).
 * - mock mode: through MockApi on a temporary in-memory mock database (Node driver; expo-sqlite
 *   doesn't run in plain Node).
 * Exits 1 if any check fails.
 */
import fs from 'node:fs';
import path from 'node:path';

import { createNodeDriver } from '@/db/testing/nodeDriver';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import type { Staple } from '@/domain/types';
import type { FridgeChefApi } from '@/services/api/FridgeChefApi';
import { isApiError } from '@/services/api/errors';
import { HttpApi } from '@/services/api/http/HttpApi';
import { httpOptionsFromConfig } from '@/services/api/http/options';
import { MockApi } from '@/services/api/mock/MockApi';
import { prepareMockDatabase } from '@/services/api/mock/db/schema';
import { config } from '@/services/config';

// A valid 1×1 JPEG, so a real backend receives a decodable image.
const TINY_JPEG =
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

async function check(name: string, run: () => Promise<string>): Promise<void> {
  const started = Date.now();
  try {
    const detail = await run();
    results.push({ name, ok: true, detail: `${detail} (${Date.now() - started} ms)` });
  } catch (error) {
    const detail = isApiError(error)
      ? `${error.kind}${error.status ? ` ${error.status}` : ''}: ${error.detail ?? error.message}`
      : String(error);
    results.push({ name, ok: false, detail });
  }
}

function appVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  return String(pkg.version ?? '0.0.0');
}

async function main(): Promise<void> {
  const mode = config.API_MODE;
  let api: FridgeChefApi;
  if (mode === 'http') {
    api = new HttpApi(httpOptionsFromConfig(config, `fridgechef-ios/${appVersion()}-smoke`));
    console.log(`API smoke · http · ${config.API_BASE_URL}`);
  } else {
    const db = createNodeDriver();
    await prepareMockDatabase(db);
    api = new MockApi({ openDb: async () => db, latencyMs: 0, failureRate: 0 });
    console.log('API smoke · mock · temporary in-memory fridgechef-mock.db');
  }

  let staples: Staple[] = [];
  let firstRecipeId = 'butter-chicken';
  const now = new Date().toISOString();

  await check('GET  /v1/catalog', async () => {
    const c = await api.getCatalog();
    staples = c.defaultStaples.map((s) => ({ ...s, level: 3, updatedAt: now }));
    return `${c.moods.length} moods, ${c.cuisines.length} cuisines, ${c.defaultStaples.length} default staples`;
  });

  let items: Awaited<ReturnType<FridgeChefApi['detectIngredients']>>['items'] = [];
  await check('POST /v1/scans/detect', async () => {
    const r = await api.detectIngredients({
      images: [1, 2, 3].map((i) => ({ id: `ph${i}`, mimeType: 'image/jpeg', base64: TINY_JPEG })),
      knownStapleIds: staples.map((s) => s.id),
      locale: 'en-IN',
      units: 'metric',
    });
    items = r.items;
    return `${r.items.length} items, ${r.warnings.length} photo warning(s), scan ${r.scanId}`;
  });

  await check('POST /v1/recipes/suggest', async () => {
    const recipes = await api.suggestRecipes({
      kitchen: { items, staples, autoInclude: true, excluded: {} },
      prefs: DEFAULT_PREFERENCES,
      profile: { allergies: [] },
    });
    if (recipes[0]) firstRecipeId = recipes[0].id;
    return `${recipes.length} recipes`;
  });

  await check(`GET  /v1/recipes/${firstRecipeId}`, async () => {
    const r = await api.getRecipe(firstRecipeId);
    return `"${r.name}", ${r.ingredients.length} ingredients, ${r.steps.length} steps`;
  });

  await check('GET  /v1/recipes/<unknown> → not_found', async () => {
    try {
      await api.getRecipe('fridgechef-smoke-unknown-id');
    } catch (error) {
      if (isApiError(error) && error.kind === 'not_found') return 'not_found as expected';
      throw error;
    }
    throw new Error('expected a 404 not_found, got a recipe');
  });

  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}  ${r.detail}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(
    failed
      ? `\n${failed} of ${results.length} checks failed`
      : `\nAll ${results.length} checks passed`,
  );
  process.exitCode = failed ? 1 : 0;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
