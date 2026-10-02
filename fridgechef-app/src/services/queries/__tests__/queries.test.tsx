import { act, cleanup, renderHook, waitFor } from '@testing-library/react-native';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { initDatabase } from '@/db/bootstrap';
import { setDatabaseForTests } from '@/db/client';
import { createNodeDriver, type NodeDriver } from '@/db/testing/nodeDriver';
import { DEFAULT_PREFERENCES } from '@/domain/preferences';
import { setApiForTests, type FridgeChefApi } from '@/services/api';
import { ApiError } from '@/services/api/errors';
import {
  QueryProvider,
  createQueryClient,
  queryKeys,
  useCatalog,
  useDetectIngredients,
  useRecipe,
  useSuggestions,
} from '@/services/queries';
import { appStores, flushWrites, hydrateStores } from '@/state';
import { createMockDb, detectInput, fastMockApi, suggestInput } from '@/testing/apiHelpers';
import { mockupKitchen, recipeById } from '@/testing/mockupData';

let userDb: NodeDriver;
let mockDb: NodeDriver;
let api: FridgeChefApi;

/** Every client a test made; cleared afterwards so no gc timer keeps Jest alive. */
const clients: QueryClient[] = [];

// Infinity = no gc timers (the mutation cache's 5-minute timer would keep Jest alive).
const testClient = () =>
  createQueryClient({ queries: { gcTime: Infinity }, mutations: { gcTime: Infinity } });

const wrapperWith = (client = testClient()) => {
  clients.push(client);
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryProvider client={client}>{children}</QueryProvider>;
  }
  return { client, wrapper: Wrapper };
};

beforeEach(async () => {
  userDb = createNodeDriver();
  setDatabaseForTests(userDb);
  await initDatabase({ mode: 'mock' });
  await hydrateStores(appStores);
  mockDb = await createMockDb();
  api = fastMockApi(mockDb);
  setApiForTests(api);
});

afterEach(async () => {
  // Unmount first (that is what starts the gc timers), then drop every cached query.
  await cleanup();
  clients.splice(0).forEach((c) => c.clear());
  await flushWrites();
  setApiForTests(null);
  setDatabaseForTests(null);
  await userDb.closeAsync();
  await mockDb.closeAsync();
});

describe('useCatalog', () => {
  it('loads, then exposes data', async () => {
    const { result } = await renderHook(() => useCatalog(), { wrapper: wrapperWith().wrapper });
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data?.moods).toHaveLength(8));
    expect(result.current).toMatchObject({ isLoading: false, error: null, errorMessage: null });
  });

  it('exposes a user-safe error message (no retries on top of request())', async () => {
    const getCatalog = jest.fn(async () => {
      throw new ApiError({ kind: 'timeout' });
    });
    setApiForTests({ ...api, getCatalog });
    const { result } = await renderHook(() => useCatalog(), { wrapper: wrapperWith().wrapper });
    await waitFor(() =>
      expect(result.current.errorMessage).toBe('That took too long. Try again in a moment.'),
    );
    expect(getCatalog).toHaveBeenCalledTimes(1);
  });
});

describe('useDetectIngredients', () => {
  it('writes the detection to the scan store and toggles `detecting`', async () => {
    let seen = false;
    const unsubscribe = appStores.scan.subscribe((s) => {
      if (s.detecting) seen = true;
    });
    const { result } = await renderHook(() => useDetectIngredients(), {
      wrapper: wrapperWith().wrapper,
    });
    await act(() => result.current.detect(detectInput(3)));
    // Query notifies observers on a later tick: let waitFor see the settled state.
    await waitFor(() => expect(result.current.data?.items).toHaveLength(12));
    await waitFor(() => expect(appStores.scan.getState().detecting).toBe(false));
    unsubscribe();
    expect(seen).toBe(true);
    const scan = appStores.scan.getState();
    expect(scan).toMatchObject({ detecting: false, status: 'detected' });
    expect(scan.items).toHaveLength(12);
    expect(scan.warnings).toEqual([
      { photoIndex: 1, type: 'blurry', message: 'Photo 2 looks blurry' },
    ]);
  });

  it('leaves the store alone and shows a message on failure', async () => {
    setApiForTests({
      ...api,
      detectIngredients: async () => {
        throw new ApiError({ kind: 'network' });
      },
    });
    const { result } = await renderHook(() => useDetectIngredients(), {
      wrapper: wrapperWith().wrapper,
    });
    await act(() => result.current.detect(detectInput(1)));
    await waitFor(() => expect(result.current.errorMessage).toMatch(/No connection/));
    expect(appStores.scan.getState()).toMatchObject({ items: [], detecting: false });
  });
});

describe('useSuggestions', () => {
  it('fetches for an input, is idle for null, and keys by the request (not by filter / sort)', async () => {
    const input = suggestInput(mockupKitchen());
    const { result, rerender } = await renderHook(
      ({ i }: { i: ReturnType<typeof suggestInput> | null }) => useSuggestions(i),
      { wrapper: wrapperWith().wrapper, initialProps: { i: null } },
    );
    expect(result.current).toMatchObject({ isLoading: false, data: undefined });
    await rerender({ i: input });
    await waitFor(() => expect(result.current.data).toHaveLength(9));

    const resorted = suggestInput(mockupKitchen(), { sort: 'quick', filter: 'onepan' });
    expect(queryKeys.suggestions(resorted)).toEqual(queryKeys.suggestions(input));
    expect(queryKeys.suggestions(suggestInput(mockupKitchen(), { timeMin: 15 }))).not.toEqual(
      queryKeys.suggestions(input),
    );
    expect(queryKeys.suggestions({ ...input, prefs: { ...DEFAULT_PREFERENCES } })).toEqual(
      queryKeys.suggestions(input),
    );
  });
});

describe('useRecipe', () => {
  it('shows a saved snapshot at once, then refreshes it (and the snapshot)', async () => {
    const snapshot = { ...recipeById('palak-paneer'), name: 'Old name' };
    await appStores.cookbook.getState().refreshSnapshot(snapshot);
    const { result } = await renderHook(() => useRecipe('palak-paneer'), {
      wrapper: wrapperWith().wrapper,
    });
    expect(result.current.data?.name).toBe('Old name');
    await waitFor(() => expect(result.current.data?.name).toBe('Palak Paneer'));
    expect(appStores.cookbook.getState().snapshots['palak-paneer']?.name).toBe('Palak Paneer');
  });

  it('uses a recipe from the suggestions cache as initial data', async () => {
    const { client, wrapper } = wrapperWith();
    client.setQueryData(queryKeys.suggestions(suggestInput(mockupKitchen())), [
      recipeById('curd-rice'),
    ]);
    const getRecipe = jest.fn(() => new Promise<never>(() => undefined));
    setApiForTests({ ...api, getRecipe });
    const { result } = await renderHook(() => useRecipe('curd-rice'), { wrapper });
    expect(result.current.data?.id).toBe('curd-rice');
    expect(getRecipe).toHaveBeenCalledTimes(1); // still refreshed in the background
  });

  it('is idle without an id; not_found surfaces its message', async () => {
    const idle = await renderHook(() => useRecipe(undefined), { wrapper: wrapperWith().wrapper });
    expect(idle.result.current.data).toBeUndefined();
    const { result } = await renderHook(() => useRecipe('ghost'), {
      wrapper: wrapperWith().wrapper,
    });
    await waitFor(() =>
      expect(result.current.errorMessage).toBe("That recipe isn't available anymore."),
    );
  });
});
