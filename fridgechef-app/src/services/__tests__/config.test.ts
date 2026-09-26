import { ConfigError, parseConfig, type Config } from '@/services/config';

describe('parseConfig', () => {
  it('applies the documented defaults when nothing is set', () => {
    expect(parseConfig({})).toEqual<Config>({
      API_MODE: 'mock',
      API_BASE_URL: '',
      API_KEY: '',
      API_AUTH_HEADER: 'Authorization',
      API_AUTH_SCHEME: 'Bearer',
      API_TIMEOUT_MS: 30000,
      MOCK_LATENCY_MS: 900,
      MOCK_FAILURE_RATE: 0,
    });
  });

  it('treats blank values (KEY= in .env) as unset', () => {
    const config = parseConfig({
      API_MODE: '',
      API_AUTH_HEADER: '  ',
      API_TIMEOUT_MS: '',
      MOCK_LATENCY_MS: '',
      MOCK_FAILURE_RATE: '',
    });
    expect(config.API_MODE).toBe('mock');
    expect(config.API_AUTH_HEADER).toBe('Authorization');
    expect(config.API_TIMEOUT_MS).toBe(30000);
    expect(config.MOCK_LATENCY_MS).toBe(900);
    expect(config.MOCK_FAILURE_RATE).toBe(0);
  });

  it('returns a frozen object', () => {
    const config = parseConfig({});
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('parses numbers and trims a trailing slash from the base URL', () => {
    const config = parseConfig({
      API_MODE: 'HTTP',
      API_BASE_URL: 'https://api.example.com/',
      API_KEY: 'k_123',
      API_TIMEOUT_MS: '45000',
      MOCK_LATENCY_MS: '0',
      MOCK_FAILURE_RATE: '0.25',
    });
    expect(config.API_MODE).toBe('http');
    expect(config.API_BASE_URL).toBe('https://api.example.com');
    expect(config.API_KEY).toBe('k_123');
    expect(config.API_TIMEOUT_MS).toBe(45000);
    expect(config.MOCK_LATENCY_MS).toBe(0);
    expect(config.MOCK_FAILURE_RATE).toBe(0.25);
  });

  describe('http mode', () => {
    it('throws a clear error when the base URL is missing', () => {
      expect(() => parseConfig({ API_MODE: 'http' })).toThrow(ConfigError);
      expect(() => parseConfig({ API_MODE: 'http', API_BASE_URL: '' })).toThrow(
        /EXPO_PUBLIC_API_BASE_URL: is required when EXPO_PUBLIC_API_MODE=http/,
      );
    });

    it('accepts a base URL', () => {
      expect(
        parseConfig({ API_MODE: 'http', API_BASE_URL: 'http://localhost:8080' }).API_MODE,
      ).toBe('http');
    });
  });

  describe('auth header and scheme', () => {
    it('default to "Authorization: Bearer <key>"', () => {
      const config = parseConfig({ API_KEY: 'abc' });
      expect(config.API_AUTH_HEADER).toBe('Authorization');
      expect(config.API_AUTH_SCHEME).toBe('Bearer');
    });

    it('allow a custom header and an explicitly empty scheme (raw key)', () => {
      const config = parseConfig({ API_AUTH_HEADER: 'x-api-key', API_AUTH_SCHEME: '' });
      expect(config.API_AUTH_HEADER).toBe('x-api-key');
      expect(config.API_AUTH_SCHEME).toBe('');
    });

    it('rejects a header name that is not a valid HTTP token', () => {
      expect(() => parseConfig({ API_AUTH_HEADER: 'x api key' })).toThrow(
        /EXPO_PUBLIC_API_AUTH_HEADER/,
      );
    });
  });

  it.each([
    ['API_MODE', 'live'],
    ['API_BASE_URL', 'not a url'],
    ['API_BASE_URL', 'ftp://api.example.com'],
    ['API_TIMEOUT_MS', '0'],
    ['API_TIMEOUT_MS', 'soon'],
    ['MOCK_LATENCY_MS', '-1'],
    ['MOCK_FAILURE_RATE', '1.5'],
  ] as const)('rejects invalid %s=%p', (key, value) => {
    expect(() => parseConfig({ [key]: value })).toThrow(new RegExp(`EXPO_PUBLIC_${key}`));
  });
});

describe('config (module export)', () => {
  const ENV_KEYS = [
    'EXPO_PUBLIC_API_MODE',
    'EXPO_PUBLIC_API_BASE_URL',
    'EXPO_PUBLIC_API_KEY',
    'EXPO_PUBLIC_API_AUTH_HEADER',
    'EXPO_PUBLIC_API_AUTH_SCHEME',
    'EXPO_PUBLIC_API_TIMEOUT_MS',
    'EXPO_PUBLIC_MOCK_LATENCY_MS',
    'EXPO_PUBLIC_MOCK_FAILURE_RATE',
  ];
  const saved = { ...process.env };

  beforeEach(() => {
    for (const key of ENV_KEYS) delete process.env[key];
  });

  afterAll(() => {
    process.env = saved;
  });

  const load = () => {
    let mod: typeof import('@/services/config') | undefined;
    jest.isolateModules(() => {
      // A fresh module instance per test re-runs the import-time parse; `import` can't do that.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('@/services/config');
    });
    return mod!;
  };

  it('reads EXPO_PUBLIC_* variables from the environment', () => {
    process.env.EXPO_PUBLIC_API_MODE = 'http';
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com';
    process.env.EXPO_PUBLIC_API_AUTH_HEADER = 'x-api-key';
    const { config } = load();
    expect(config.API_MODE).toBe('http');
    expect(config.API_BASE_URL).toBe('https://api.example.com');
    expect(config.API_AUTH_HEADER).toBe('x-api-key');
  });

  it('fails fast at import time for http mode without a base URL', () => {
    process.env.EXPO_PUBLIC_API_MODE = 'http';
    expect(load).toThrow(/EXPO_PUBLIC_API_BASE_URL/);
  });
});
