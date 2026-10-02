import { ApiError } from '@/services/api/errors';
import { HttpApi } from '@/services/api/http/HttpApi';
import { joinUrl } from '@/services/api/http/endpoints';
import { buildHeaders, request, type HttpOptions } from '@/services/api/http/request';
import { catalogSchema } from '@/services/api/contract';
import { catalogSeed } from '@/services/api/mock/db/seed/catalog';
import { recipeSeed } from '@/services/api/mock/db/seed/recipes';
import { detectInput, reply } from '@/testing/apiHelpers';

const fetchMock = jest.fn();
const realFetch = global.fetch;
let sleep: jest.Mock;

const options = (extra: Partial<HttpOptions> = {}): HttpOptions => ({
  baseUrl: 'https://api.example.test',
  apiKey: 'secret-key',
  authHeader: 'Authorization',
  authScheme: 'Bearer',
  timeoutMs: 1000,
  clientId: 'fridgechef-ios/1.2.3',
  retryBaseMs: 500,
  sleep,
  ...extra,
});

const lastInit = () =>
  fetchMock.mock.calls.at(-1)![1] as RequestInit & { headers: Record<string, string> };
const urls = () => fetchMock.mock.calls.map((c) => c[0] as string);
const failWith = (api: Promise<unknown>) =>
  api.then(
    () => undefined,
    (e: unknown) => e as ApiError,
  );

beforeEach(() => {
  fetchMock.mockReset();
  sleep = jest.fn(async () => undefined);
  global.fetch = fetchMock as unknown as typeof fetch;
});
afterAll(() => {
  global.fetch = realFetch;
});

describe('headers', () => {
  it('Bearer scheme + X-Client + JSON', async () => {
    fetchMock.mockResolvedValue(reply(200, catalogSeed));
    await new HttpApi(options()).getCatalog();
    expect(lastInit().headers).toEqual({
      Accept: 'application/json',
      'X-Client': 'fridgechef-ios/1.2.3',
      Authorization: 'Bearer secret-key',
    });
    expect(lastInit().method).toBe('GET');
  });

  it('an empty scheme sends the raw key', () => {
    expect(buildHeaders(options({ authScheme: '' }), false).Authorization).toBe('secret-key');
  });

  it('a custom header name (x-api-key)', () => {
    const h = buildHeaders(options({ authHeader: 'x-api-key', authScheme: '' }), true);
    expect(h['x-api-key']).toBe('secret-key');
    expect(h).not.toHaveProperty('Authorization');
    expect(h['Content-Type']).toBe('application/json');
  });

  it('no key → no auth header', () => {
    expect(buildHeaders(options({ apiKey: '' }), false)).not.toHaveProperty('Authorization');
  });
});

describe('URLs', () => {
  it.each([
    ['https://api.example.test', '/v1/catalog', 'https://api.example.test/v1/catalog'],
    ['https://api.example.test/', '/v1/catalog', 'https://api.example.test/v1/catalog'],
    ['https://api.example.test//', 'v1/catalog', 'https://api.example.test/v1/catalog'],
    ['https://example.test/api', '/v1/catalog', 'https://example.test/api/v1/catalog'],
    ['https://example.test/api/', '/v1/catalog', 'https://example.test/api/v1/catalog'],
  ])('%s + %s', (base, path, expected) => {
    expect(joinUrl(base, path)).toBe(expected);
  });

  it('every method hits its endpoint; POST bodies are JSON DTOs', async () => {
    const api = new HttpApi(options({ baseUrl: 'https://api.example.test/' }));
    fetchMock.mockResolvedValueOnce(reply(200, { scanId: 's', items: [], photoWarnings: [] }));
    await api.detectIngredients(detectInput(2));
    expect(JSON.parse(lastInit().body as string)).toEqual({
      images: [
        { id: 'ph1', mimeType: 'image/jpeg', data: 'AAAA' },
        { id: 'ph2', mimeType: 'image/jpeg', data: 'AAAA' },
      ],
      knownStapleIds: ['salt', 'turmeric'],
      locale: 'en-IN',
      units: 'metric',
    });
    fetchMock.mockResolvedValueOnce(reply(200, recipeSeed[0]));
    await api.getRecipe('butter chicken/1');
    expect(urls()).toEqual([
      'https://api.example.test/v1/scans/detect',
      'https://api.example.test/v1/recipes/butter%20chicken%2F1',
    ]);
  });
});

describe('errors and retries', () => {
  it('timeout → timeout (after 2 retries with backoff)', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal!.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const err = await failWith(new HttpApi(options({ timeoutMs: 20 })).getCatalog());
    expect(err).toMatchObject({ kind: 'timeout' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([500, 1000]);
  });

  it('network failure → network; detect retries only once', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({ kind: 'network' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mockClear();
    expect(await failWith(new HttpApi(options()).detectIngredients(detectInput(1)))).toMatchObject({
      kind: 'network',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('401 / 403 → unauthorized, no retry', async () => {
    fetchMock.mockResolvedValue(
      reply(401, { error: { code: 'unauthorized', message: 'Bad key' } }),
    );
    const err = await failWith(new HttpApi(options()).getCatalog());
    expect(err).toMatchObject({
      kind: 'unauthorized',
      status: 401,
      detail: 'unauthorized: Bad key',
    });
    expect(err!.message).not.toContain('Bad key'); // server text never reaches the UI
    fetchMock.mockResolvedValue(reply(403, ''));
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({
      kind: 'unauthorized',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('429 + retryAfterSec → exactly one retry after that wait', async () => {
    fetchMock
      .mockResolvedValueOnce(
        reply(429, { error: { code: 'rate_limited', message: 'Too many', retryAfterSec: 20 } }),
      )
      .mockResolvedValueOnce(reply(200, catalogSeed));
    await expect(new HttpApi(options()).getCatalog()).resolves.toHaveProperty('moods');
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([20_000]);

    fetchMock.mockReset();
    sleep.mockClear();
    fetchMock.mockResolvedValue(reply(429, '', { 'Retry-After': '2' }));
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({
      kind: 'rate_limited',
      retryAfterSec: 2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([2000]);
  });

  it('429 asking to wait too long is not retried', async () => {
    fetchMock.mockResolvedValue(
      reply(429, { error: { code: 'rate_limited', message: 'Later', retryAfterSec: 600 } }),
    );
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({
      kind: 'rate_limited',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('5xx → 2 retries, then server; a recovery on retry succeeds', async () => {
    fetchMock.mockResolvedValue(reply(503, 'Service Unavailable'));
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({
      kind: 'server',
      status: 503,
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(reply(500, '')).mockResolvedValueOnce(reply(200, catalogSeed));
    await expect(new HttpApi(options()).getCatalog()).resolves.toHaveProperty('cuisines');
  });

  it('other 4xx → server without retry; 404 → not_found', async () => {
    fetchMock.mockResolvedValue(reply(422, { error: { code: 'bad_request', message: 'nope' } }));
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({
      kind: 'server',
      status: 422,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValue(reply(404, { error: { code: 'not_found', message: 'x' } }));
    expect(await failWith(new HttpApi(options()).getRecipe('x'))).toMatchObject({
      kind: 'not_found',
    });
  });

  it('a malformed body → invalid_response (no retry), with the Zod issues in detail', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    fetchMock.mockResolvedValue(reply(200, { ...catalogSeed, moods: 'lots' }));
    const err = await failWith(new HttpApi(options()).getCatalog());
    expect(err).toMatchObject({ kind: 'invalid_response', status: 200 });
    expect(err!.detail).toMatch(/moods/);
    expect(warn).toHaveBeenCalled(); // logged in dev
    fetchMock.mockResolvedValue(reply(200, '<html>oops</html>'));
    expect(await failWith(new HttpApi(options()).getCatalog())).toMatchObject({
      kind: 'invalid_response',
      detail: 'Body is not JSON',
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });

  it('a caller abort cancels without retrying', async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
          controller.abort();
        }),
    );
    const err = await failWith(new HttpApi(options()).getCatalog(controller.signal));
    expect(err).toMatchObject({ kind: 'network', cancelled: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const already = await failWith(
      request(options(), {
        method: 'GET',
        path: '/v1/catalog',
        schema: catalogSchema,
        signal: controller.signal,
      }),
    );
    expect(already).toMatchObject({ cancelled: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a request that fails its own schema is never sent', async () => {
    await expect(new HttpApi(options()).detectIngredients(detectInput(0))).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
