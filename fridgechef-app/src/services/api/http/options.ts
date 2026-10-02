/** HttpApi settings from the validated config. No Expo imports, so Node scripts can use it. */
import type { Config } from '@/services/config';

import type { HttpOptions } from './request';

export const httpOptionsFromConfig = (cfg: Config, clientId: string): HttpOptions => ({
  baseUrl: cfg.API_BASE_URL,
  apiKey: cfg.API_KEY,
  authHeader: cfg.API_AUTH_HEADER,
  authScheme: cfg.API_AUTH_SCHEME,
  timeoutMs: cfg.API_TIMEOUT_MS,
  clientId,
});
