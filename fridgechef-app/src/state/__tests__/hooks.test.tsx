import { act, renderHook } from '@testing-library/react-native';

import { initDatabase } from '@/db/bootstrap';
import { setDatabaseForTests } from '@/db/client';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { match } from '@/domain/matching';
import {
  appStores,
  flushWrites,
  hydrateStores,
  useKitchen,
  useLowStaples,
  usePendingChecks,
  usePrefsStore,
} from '@/state';
import { detectedFor, recipeById } from '@/testing/mockupData';

let db: NodeDriver;

beforeEach(async () => {
  db = createNodeDriver();
  setDatabaseForTests(db);
  await initDatabase({ mode: 'mock' });
  await hydrateStores(appStores);
});

afterEach(async () => {
  await flushWrites();
  setDatabaseForTests(null);
  await db.closeAsync();
});

describe('selector hooks over appStores', () => {
  it('useKitchen feeds match; useLowStaples / usePendingChecks update with the stores', async () => {
    await act(() => appStores.scan.getState().setDetection(detectedFor(3), []));
    const { result } = await renderHook(() => ({
      kitchen: useKitchen(),
      low: useLowStaples(),
      pending: usePendingChecks(),
      servings: usePrefsStore((s) => s.servings),
    }));

    const first = result.current.kitchen;
    expect(match(recipeById('butter-chicken'), first, result.current.servings).pct).toBe(91);
    expect(result.current.low.map((s) => s.id)).toEqual(['turmeric', 'salt', 'olive_oil']);
    expect(result.current.pending.map((i) => i.id)).toEqual(['chicken', 'paneer', 'yogurt']);

    await act(() => appStores.scan.getState().confirmItem('chicken'));
    await act(() => appStores.pantry.getState().refill('salt'));
    expect(result.current.pending.map((i) => i.id)).toEqual(['paneer', 'yogurt']);
    expect(result.current.low.map((s) => s.id)).toEqual(['turmeric', 'olive_oil']);
    expect(result.current.kitchen).not.toBe(first);

    // Memoised: no store change → same object (no render loop).
    const stable = result.current.kitchen;
    await act(() => appStores.prefs.getState().setMood('lazy'));
    expect(result.current.kitchen).toBe(stable);
  });
});
