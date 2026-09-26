import { z } from 'zod';

/**
 * The ONLY module that reads the environment (see sprints/reference/architecture.md).
 *
 * Every `EXPO_PUBLIC_*` value is compiled into the app bundle and can be extracted from it.
 * Only put a key here that is meant for a client (e.g. a rate-limited key for our own backend),
 * never a secret LLM-provider key.
 */

export type ApiMode = 'mock' | 'http';

/** Raw string values as they arrive from `.env`, keyed without the `EXPO_PUBLIC_` prefix. */
export type RawEnv = Partial<
  Record<
    | 'API_MODE'
    | 'API_BASE_URL'
    | 'API_KEY'
    | 'API_AUTH_HEADER'
    | 'API_AUTH_SCHEME'
    | 'API_TIMEOUT_MS'
    | 'MOCK_LATENCY_MS'
    | 'MOCK_FAILURE_RATE',
    string | undefined
  >
>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

const trimmed = (value: unknown) => (typeof value === 'string' ? value.trim() : value);

/** `.env` lines like `KEY=` arrive as '' - treat them as unset so the default applies. */
const blankAsUnset = (value: unknown) => {
  const v = trimmed(value);
  return v === '' ? undefined : v;
};

const schema = z
  .object({
    API_MODE: z.preprocess(
      (v) => (typeof v === 'string' ? blankAsUnset(v.toLowerCase()) : v),
      z.enum(['mock', 'http']).default('mock'),
    ),
    API_BASE_URL: z.preprocess(
      trimmed,
      z
        .union([z.literal(''), z.url({ protocol: /^https?$/ })])
        .default('')
        .transform((url) => url.replace(/\/+$/, '')),
    ),
    API_KEY: z.preprocess(trimmed, z.string().default('')),
    API_AUTH_HEADER: z.preprocess(
      blankAsUnset,
      z
        .string()
        .regex(/^[A-Za-z0-9-]+$/, 'must be a valid HTTP header name')
        .default('Authorization'),
    ),
    // Unset -> 'Bearer'; explicitly empty -> '' (send the raw key with no prefix).
    API_AUTH_SCHEME: z.preprocess(trimmed, z.string().default('Bearer')),
    API_TIMEOUT_MS: z.preprocess(blankAsUnset, z.coerce.number().int().positive().default(30000)),
    MOCK_LATENCY_MS: z.preprocess(blankAsUnset, z.coerce.number().int().min(0).default(900)),
    MOCK_FAILURE_RATE: z.preprocess(blankAsUnset, z.coerce.number().min(0).max(1).default(0)),
  })
  .superRefine((env, ctx) => {
    if (env.API_MODE === 'http' && env.API_BASE_URL === '') {
      ctx.addIssue({
        code: 'custom',
        path: ['API_BASE_URL'],
        message:
          'is required when EXPO_PUBLIC_API_MODE=http. Set it in .env, or use EXPO_PUBLIC_API_MODE=mock',
      });
    }
  });

export type Config = Readonly<z.output<typeof schema>>;

/** Validates raw env values and applies defaults. Throws `ConfigError` on invalid input. */
export function parseConfig(raw: RawEnv): Config {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - EXPO_PUBLIC_${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new ConfigError(`Invalid FridgeChef environment config:\n${problems}`);
  }
  return Object.freeze(result.data);
}

function readEnv(): RawEnv {
  // Static references only: Expo inlines EXPO_PUBLIC_* at build time and cannot see
  // dynamic lookups such as process.env[name].
  return {
    API_MODE: process.env.EXPO_PUBLIC_API_MODE,
    API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
    API_KEY: process.env.EXPO_PUBLIC_API_KEY,
    API_AUTH_HEADER: process.env.EXPO_PUBLIC_API_AUTH_HEADER,
    API_AUTH_SCHEME: process.env.EXPO_PUBLIC_API_AUTH_SCHEME,
    API_TIMEOUT_MS: process.env.EXPO_PUBLIC_API_TIMEOUT_MS,
    MOCK_LATENCY_MS: process.env.EXPO_PUBLIC_MOCK_LATENCY_MS,
    MOCK_FAILURE_RATE: process.env.EXPO_PUBLIC_MOCK_FAILURE_RATE,
  };
}

/** Frozen, validated app config. Fails fast at startup if the env is invalid. */
export const config: Config = parseConfig(readEnv());
