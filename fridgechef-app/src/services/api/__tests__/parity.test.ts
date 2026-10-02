/**
 * The "minimal change" guarantee: HttpApi, fed by a fetch that serves the mock backend's replies,
 * returns deep-equal domain data to MockApi for the same inputs. So flipping
 * EXPO_PUBLIC_API_MODE needs no code change as long as the real backend follows the contract.
 */
import type { NodeDriver } from '@/db/testing/nodeDriver';
import type { FridgeChefApi } from '@/services/api/FridgeChefApi';
import { HttpApi } from '@/services/api/http/HttpApi';
import { endpoints } from '@/services/api/http/endpoints';
import type { RawResponse } from '@/services/api/http/request';
import { createMockBackend } from '@/services/api/mock/mockBackend';
import { createMockDb, detectInput, fastMockApi, reply, suggestInput } from '@/testing/apiHelpers';
import { mockupKitchen } from '@/testing/mockupData';

const BASE = 'https://api.example.test';
const realFetch = global.fetch;

let db: NodeDriver;
let mock: FridgeChefApi;
let http: FridgeChefApi;

beforeEach(async () => {
  db = await createMockDb();
  mock = fastMockApi(db);
  const backend = createMockBackend(async () => db);
  // A tiny router: URL + method → the mock backend, answered as an HTTP reply.
  global.fetch = jest.fn(async (url: string, init: RequestInit) => {
    const path = url.slice(BASE.length);
    const body = init.body ? JSON.parse(init.body as string) : undefined;
    let res: RawResponse;
    if (path === endpoints.catalog) res = await backend.catalog();
    else if (path === endpoints.detect) res = await backend.detect(body);
    else if (path === endpoints.suggest) res = await backend.suggest(body);
    else res = await backend.recipe(decodeURIComponent(path.replace('/v1/recipes/', '')));
    return reply(res.status, res.text);
  }) as unknown as typeof fetch;
  http = new HttpApi({
    baseUrl: BASE,
    apiKey: 'k',
    authHeader: 'Authorization',
    authScheme: 'Bearer',
    timeoutMs: 1000,
    clientId: 'fridgechef-ios/test',
    sleep: async () => undefined,
  });
});
afterEach(() => db.closeAsync());
afterAll(() => {
  global.fetch = realFetch;
});

describe('MockApi ⇄ HttpApi parity', () => {
  it('getCatalog', async () => {
    expect(await http.getCatalog()).toEqual(await mock.getCatalog());
  });

  it.each([1, 2, 3, 6])('detectIngredients with %i photo(s)', async (n) => {
    expect(await http.detectIngredients(detectInput(n))).toEqual(
      await mock.detectIngredients(detectInput(n)),
    );
  });

  it.each([
    ['defaults', {}, 9],
    ['15 min', { timeMin: 15 }, 4],
    ['vegetarian', { diet: 'veg' }, 4],
    ['Thai', { cuisines: ['Thai'] }, 0],
    ['chef + oven', { effort: 'chef', equipment: ['stove', 'oven', 'blender'] }, 10],
  ] as const)('suggestRecipes (%s)', async (_label, prefs, count) => {
    const input = suggestInput(mockupKitchen(), prefs);
    const [a, b] = [await http.suggestRecipes(input), await mock.suggestRecipes(input)];
    expect(a).toEqual(b);
    expect(a).toHaveLength(count);
  });

  it('getRecipe, and not_found for an unknown id', async () => {
    expect(await http.getRecipe('palak-paneer')).toEqual(await mock.getRecipe('palak-paneer'));
    const [e1, e2] = await Promise.all([
      http.getRecipe('ghost').catch((e: unknown) => e),
      mock.getRecipe('ghost').catch((e: unknown) => e),
    ]);
    expect(e1).toMatchObject({ kind: 'not_found', status: 404 });
    expect(e2).toMatchObject({ kind: 'not_found', status: 404 });
  });
});
