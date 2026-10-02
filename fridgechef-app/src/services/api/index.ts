/**
 * The API entry point. `getApi()` picks MockApi or HttpApi from `EXPO_PUBLIC_API_MODE`; this is
 * the ONLY module outside `services/api/**` internals that constructs them (architecture-rules test).
 * Going live is a `.env` change: nothing that calls `getApi()` knows which one it gets.
 */
import Constants from 'expo-constants';
import { z } from 'zod';

import { config, type Config } from '@/services/config';

import type { FridgeChefApi } from './FridgeChefApi';
import { HttpApi } from './http/HttpApi';
import { httpOptionsFromConfig } from './http/options';
import { MockApi } from './mock/MockApi';
import { openMockDatabase, resetMockDatabase } from './mock/db/mockDb';
import { mockRepo } from './mock/db/mockRepo';

export type {
  DetectInput,
  DetectionResult,
  FridgeChefApi,
  PreparedImage,
  SuggestInput,
} from './FridgeChefApi';
export { ApiError, isApiError, toUserMessage, type ApiErrorKind } from './errors';
export { httpOptionsFromConfig } from './http/options';

/** A demo photo for Scan → "Use demo photos" (mock mode only). */
export type DemoPhoto = { id: string; label: string; uri: string };
const demoPhotoSchema = z.object({ id: z.string(), label: z.string(), uri: z.string() });

/** `X-Client: fridgechef-ios/<appVersion>` (api-contract.md). */
export const clientId = (): string => `fridgechef-ios/${Constants.expoConfig?.version ?? '0.0.0'}`;

/**
 * Builds the implementation for a config. Mock mode opens `fridgechef-mock.db` lazily, on the
 * first call; http mode never opens it.
 */
export function createApi(cfg: Config = config): FridgeChefApi {
  if (cfg.API_MODE === 'http') return new HttpApi(httpOptionsFromConfig(cfg, clientId()));
  return new MockApi({
    openDb: openMockDatabase,
    latencyMs: cfg.MOCK_LATENCY_MS,
    failureRate: cfg.MOCK_FAILURE_RATE,
  });
}

let instance: FridgeChefApi | null = null;

/** The app's API (a singleton for the configured mode). */
export function getApi(): FridgeChefApi {
  instance ??= createApi(config);
  return instance;
}

/** Tests: use this implementation for `getApi()`; `null` goes back to the configured one. */
export function setApiForTests(api: FridgeChefApi | null): void {
  instance = api;
}

/**
 * Profile → "Reset demo data", backend side: restores the mock database's seed in mock mode;
 * nothing in http mode (the real backend isn't ours to reset).
 */
export async function resetBackendData(cfg: Config = config): Promise<void> {
  if (cfg.API_MODE === 'mock') await resetMockDatabase();
}

/** The demo photo library in mock mode; `[]` in http mode (the mock database isn't opened). */
export async function listDemoPhotos(cfg: Config = config): Promise<DemoPhoto[]> {
  if (cfg.API_MODE !== 'mock') return [];
  const rows = await mockRepo.demoPhotos(await openMockDatabase());
  return rows.map((row) => demoPhotoSchema.parse(row));
}
