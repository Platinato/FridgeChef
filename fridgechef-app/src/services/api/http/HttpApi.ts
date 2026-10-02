/** FridgeChefApi over HTTP. Created only by `getApi()` (and the smoke script / tests). */
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
import {
  toCatalog,
  toDetectRequest,
  toDetectionResult,
  toRecipe,
  toSuggestRequest,
} from '../mappers';
import { endpoints } from './endpoints';
import { request, type HttpOptions } from './request';

/** Detection is slow and expensive: a failed attempt is retried once, not twice. */
const DETECT_NETWORK_RETRIES = 1;

export class HttpApi implements FridgeChefApi {
  constructor(private readonly options: HttpOptions) {}

  async getCatalog(signal?: AbortSignal): Promise<CatalogData> {
    const dto = await request(this.options, {
      method: 'GET',
      path: endpoints.catalog,
      schema: catalogSchema,
      signal,
    });
    return toCatalog(dto);
  }

  async detectIngredients(input: DetectInput, signal?: AbortSignal): Promise<DetectionResult> {
    const dto = await request(this.options, {
      method: 'POST',
      path: endpoints.detect,
      // Parsing the request too catches a bad payload before it costs an upload.
      body: detectRequestSchema.parse(toDetectRequest(input)),
      schema: detectResponseSchema,
      signal,
      networkRetries: DETECT_NETWORK_RETRIES,
    });
    return toDetectionResult(dto);
  }

  async suggestRecipes(input: SuggestInput, signal?: AbortSignal): Promise<Recipe[]> {
    const dto = await request(this.options, {
      method: 'POST',
      path: endpoints.suggest,
      body: suggestRequestSchema.parse(toSuggestRequest(input)),
      schema: suggestResponseSchema,
      signal,
    });
    return dto.recipes.map(toRecipe);
  }

  async getRecipe(id: string, signal?: AbortSignal): Promise<Recipe> {
    const dto = await request(this.options, {
      method: 'GET',
      path: endpoints.recipe(id),
      schema: recipeResponseSchema,
      signal,
    });
    return toRecipe(dto);
  }
}
