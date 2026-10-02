/** Test-only helpers for the API layer. Never imported by app code (architecture-rules test). */
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import type { Kitchen } from '@/domain/types';
import type { DetectInput, SuggestInput } from '@/services/api/FridgeChefApi';
import { MockApi } from '@/services/api/mock/MockApi';
import { prepareMockDatabase } from '@/services/api/mock/db/schema';

/** A migrated + seeded in-memory mock database. */
export async function createMockDb(): Promise<NodeDriver> {
  const db = createNodeDriver();
  await prepareMockDatabase(db);
  return db;
}

/** MockApi on `db` with no latency and no injected failures. */
export const fastMockApi = (
  db: NodeDriver,
  extra: Partial<ConstructorParameters<typeof MockApi>[0]> = {},
) => new MockApi({ openDb: async () => db, latencyMs: 0, failureRate: 0, ...extra });

export const detectInput = (photos: number): DetectInput => ({
  images: Array.from({ length: photos }, (_, i) => ({
    id: `ph${i + 1}`,
    mimeType: 'image/jpeg',
    base64: 'AAAA',
  })),
  knownStapleIds: ['salt', 'turmeric'],
  locale: 'en-IN',
  units: 'metric',
});

export const suggestInput = (kitchen: Kitchen, prefs = {}): SuggestInput => ({
  kitchen,
  prefs: { ...DEFAULT_PREFERENCES, ...prefs },
  profile: { allergies: [] },
});

/** A minimal fetch Response. */
export const reply = (status: number, body: unknown, headers: Record<string, string> = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name: string) => headers[name] ?? null },
  text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
});
