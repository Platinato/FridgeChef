/**
 * FridgeChefApi on the on-device mock database. Requests are built with the same mappers +
 * request schemas as HttpApi, and every reply goes through the same `decodeResponse` (status →
 * ApiError, JSON, Zod) and mappers, so mock mode exercises the real parsing path.
 * Created only by `getApi()` (and the smoke script / tests).
 */
import type { SqlDriver } from '@/db/driver';
import type { CatalogData, Recipe } from '@/domain/types';

import {
  catalogSchema,
  detectRequestSchema,
  detectResponseSchema,
  recipeResponseSchema,
  suggestRequestSchema,
  suggestResponseSchema,
} from '../contract';
import type { DetectInput, DetectionResult, FridgeChefApi, SuggestInput } from '../FridgeChefApi';
import { decodeResponse, defaultSleep, type RawResponse } from '../http/request';
import {
  toCatalog,
  toDetectRequest,
  toDetectionResult,
  toRecipe,
  toSuggestRequest,
} from '../mappers';
import { createMockBackend } from './mockBackend';

export type MockApiOptions = {
  /** Opens (and migrates + seeds) the mock database; called lazily on the first request. */
  openDb: () => Promise<SqlDriver>;
  /** Simulated latency per call (abortable). */
  latencyMs: number;
  /** 0-1 chance a call fails with a `server` error. */
  failureRate: number;
  /** Injectable for tests. */
  random?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
};

export class MockApi implements FridgeChefApi {
  private readonly backend;

  constructor(private readonly options: MockApiOptions) {
    this.backend = createMockBackend(options.openDb);
  }

  /** Latency, then either an injected failure or the backend's reply, decoded like HTTP. */
  private async call<T>(
    signal: AbortSignal | undefined,
    reply: () => Promise<RawResponse>,
    decode: (res: RawResponse) => T,
  ): Promise<T> {
    const { latencyMs, failureRate, random = Math.random, sleep = defaultSleep } = this.options;
    await sleep(latencyMs, signal);
    const res = random() < failureRate ? this.backend.injectedFailure() : await reply();
    return decode(res);
  }

  getCatalog(signal?: AbortSignal): Promise<CatalogData> {
    return this.call(
      signal,
      () => this.backend.catalog(),
      (res) => toCatalog(decodeResponse(res, catalogSchema, 'mock catalog')),
    );
  }

  detectIngredients(input: DetectInput, signal?: AbortSignal): Promise<DetectionResult> {
    const req = detectRequestSchema.parse(toDetectRequest(input));
    return this.call(
      signal,
      () => this.backend.detect(req),
      (res) => toDetectionResult(decodeResponse(res, detectResponseSchema, 'mock detect')),
    );
  }

  suggestRecipes(input: SuggestInput, signal?: AbortSignal): Promise<Recipe[]> {
    const req = suggestRequestSchema.parse(toSuggestRequest(input));
    return this.call(
      signal,
      () => this.backend.suggest(req),
      (res) => decodeResponse(res, suggestResponseSchema, 'mock suggest').recipes.map(toRecipe),
    );
  }

  getRecipe(id: string, signal?: AbortSignal): Promise<Recipe> {
    return this.call(
      signal,
      () => this.backend.recipe(id),
      (res) => toRecipe(decodeResponse(res, recipeResponseSchema, `mock recipe ${id}`)),
    );
  }
}
