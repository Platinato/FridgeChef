import { openDatabaseByName } from '@/db/client';
import { createNodeDriver } from '@/db/testing/nodeDriver';
import {
  clientId,
  createApi,
  getApi,
  httpOptionsFromConfig,
  listDemoPhotos,
  setApiForTests,
  type FridgeChefApi,
} from '@/services/api';
import { HttpApi } from '@/services/api/http/HttpApi';
import { MockApi } from '@/services/api/mock/MockApi';
import { resetMockDatabaseForTests } from '@/services/api/mock/db/mockDb';
import { catalogSeed } from '@/services/api/mock/db/seed/catalog';
import { parseConfig } from '@/services/config';
import { reply } from '@/testing/apiHelpers';

// The device opener is replaced by the Node driver; the spy counts how often it's used.
jest.mock('@/db/client', () => ({
  ...jest.requireActual('@/db/client'),
  openDatabaseByName: jest.fn(),
}));
const openSpy = openDatabaseByName as jest.MockedFunction<typeof openDatabaseByName>;

const httpConfig = parseConfig({
  API_MODE: 'http',
  API_BASE_URL: 'https://api.example.test/',
  API_KEY: 'k',
  API_AUTH_HEADER: 'x-api-key',
  API_AUTH_SCHEME: '',
});
const mockConfig = parseConfig({ API_MODE: 'mock', MOCK_LATENCY_MS: '0' });
const realFetch = global.fetch;

beforeEach(() => {
  openSpy.mockReset();
  openSpy.mockImplementation(async () => createNodeDriver());
  resetMockDatabaseForTests();
});
afterAll(() => {
  global.fetch = realFetch;
});

describe('createApi / getApi', () => {
  it('http mode builds HttpApi from config and NEVER opens the mock database', async () => {
    global.fetch = jest.fn(async () => reply(200, catalogSeed)) as unknown as typeof fetch;
    const api = createApi(httpConfig);
    expect(api).toBeInstanceOf(HttpApi);
    await api.getCatalog();
    expect(await listDemoPhotos(httpConfig)).toEqual([]);
    expect(openSpy).not.toHaveBeenCalled();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toBe('https://api.example.test/v1/catalog');
    expect(init.headers['x-api-key']).toBe('k');
    expect(init.headers['X-Client']).toMatch(/^fridgechef-ios\//);
  });

  it('mock mode opens fridgechef-mock.db lazily, once', async () => {
    const api = createApi(mockConfig);
    expect(api).toBeInstanceOf(MockApi);
    expect(openSpy).not.toHaveBeenCalled();
    await api.getCatalog();
    await api.getRecipe('curd-rice');
    expect(await listDemoPhotos(mockConfig)).toHaveLength(6);
    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith('fridgechef-mock.db');
  });

  it('httpOptionsFromConfig maps every setting', () => {
    expect(httpOptionsFromConfig(httpConfig, 'fridgechef-ios/9')).toEqual({
      baseUrl: 'https://api.example.test',
      apiKey: 'k',
      authHeader: 'x-api-key',
      authScheme: '',
      timeoutMs: 30000,
      clientId: 'fridgechef-ios/9',
    });
    expect(clientId()).toMatch(/^fridgechef-ios\/\d/);
  });

  it('getApi is a singleton that setApiForTests can replace', () => {
    const fake = {} as FridgeChefApi;
    setApiForTests(fake);
    expect(getApi()).toBe(fake);
    setApiForTests(null);
    const real = getApi();
    expect(real).toBeInstanceOf(MockApi); // the default config is mock mode
    expect(getApi()).toBe(real);
  });
});
