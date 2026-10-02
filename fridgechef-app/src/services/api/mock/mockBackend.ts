/**
 * The stand-in backend: takes request DTOs, reads the mock database, and answers with a raw reply
 * (status + JSON text) exactly as a server would (api-contract.md → Mock behaviour). MockApi decodes
 * the reply through the same path as HttpApi; the parity test serves it over a mocked `fetch`.
 */
import type { SqlDriver } from '@/db/driver';
import { passes } from '@/domain/suggestions';

import {
  recipeSchema,
  type DetectRequestDto,
  type ErrorEnvelopeDto,
  type SuggestRequestDto,
} from '../contract';
import type { RawResponse } from '../http/request';
import { toRecipe } from '../mappers';
import { mockRepo } from './db/mockRepo';

/** With 3+ photos the second one comes back blurry, so the warning UI has something to show. */
export const BLURRY_WARNING = {
  photoIndex: 1,
  type: 'blurry',
  message: 'Photo 2 looks blurry',
} as const;

const ok = (body: unknown): RawResponse => ({ status: 200, text: JSON.stringify(body) });
const fail = (status: number, code: string, message: string): RawResponse => ({
  status,
  text: JSON.stringify({ error: { code, message } } satisfies ErrorEnvelopeDto),
});

export type MockBackend = ReturnType<typeof createMockBackend>;

export function createMockBackend(openDb: () => Promise<SqlDriver>) {
  return {
    async catalog(): Promise<RawResponse> {
      const dto = await mockRepo.catalog(await openDb());
      return dto ? ok(dto) : fail(500, 'server_error', 'Catalog missing');
    },

    async detect(req: DetectRequestDto): Promise<RawResponse> {
      const n = req.images.length;
      return ok({
        scanId: `scn_mock_${req.images.map((i) => i.id).join('_')}`,
        items: await mockRepo.detections(await openDb(), n),
        photoWarnings: n >= 3 ? [BLURRY_WARNING] : [],
      });
    },

    /** The server's job: recipes that fit the preferences (the client ranks them). */
    async suggest(req: SuggestRequestDto): Promise<RawResponse> {
      const rows = await mockRepo.recipes(await openDb());
      const prefs = { ...req.preferences, filter: 'all', sort: 'best' } as const;
      const fits = rows.filter((row) =>
        passes(toRecipe(recipeSchema.parse(row)), prefs, req.preferences.allergies),
      );
      return ok({ recipes: fits.slice(0, req.limit) });
    },

    async recipe(id: string): Promise<RawResponse> {
      const dto = await mockRepo.recipe(await openDb(), id);
      return dto ? ok(dto) : fail(404, 'not_found', `No recipe with id "${id}"`);
    },

    /** An injected failure (EXPO_PUBLIC_MOCK_FAILURE_RATE). */
    injectedFailure: (): RawResponse => fail(503, 'server_error', 'Injected mock failure'),
  };
}
