/**
 * Query hooks: the only way screens talk to the backend. They call `getApi()` (mock or http),
 * never an implementation, and return a UI-friendly shape with a ready-to-show error message.
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { CatalogData, Recipe } from '@/domain/types';
import {
  getApi,
  isApiError,
  listDemoPhotos,
  resetBackendData,
  toUserMessage,
  type DemoPhoto,
  type DetectInput,
  type DetectionResult,
  type SuggestInput,
} from '@/services/api';
import { config } from '@/services/config';
import { resetAll } from '@/state';
import { appStores } from '@/state/appStores';

import { queryKeys } from './keys';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** What a screen needs from a query. */
export type QueryView<T> = {
  data: T | undefined;
  /** First load with nothing to show yet. */
  isLoading: boolean;
  /** Any request in flight (including a background refresh). */
  isFetching: boolean;
  error: Error | null;
  /** Short copy for the UI, or null. */
  errorMessage: string | null;
  refetch: () => void;
};

function view<T>(q: UseQueryResult<T, Error>): QueryView<T> {
  return {
    data: q.data,
    isLoading: q.isLoading,
    isFetching: q.isFetching,
    error: q.error,
    errorMessage: q.error ? toUserMessage(q.error) : null,
    refetch: () => void q.refetch(),
  };
}

/** Moods, cuisines, diets, allergies, equipment, addable items, staples. Cached 24 h. */
export function useCatalog(): QueryView<CatalogData> {
  return view(
    useQuery({
      queryKey: queryKeys.catalog,
      queryFn: ({ signal }) => getApi().getCatalog(signal),
      staleTime: DAY_MS,
      gcTime: DAY_MS,
    }),
  );
}

/** `signal` aborts the request (e.g. the Analyzing screen unmounts); an aborted call writes nothing. */
export type DetectOptions = { signal?: AbortSignal };

export type DetectView = {
  /** Starts detection; on success the scan store gets the items + warnings. */
  detect: (input: DetectInput, options?: DetectOptions) => void;
  detectAsync: (input: DetectInput, options?: DetectOptions) => Promise<DetectionResult>;
  isPending: boolean;
  data: DetectionResult | undefined;
  error: Error | null;
  /** Short copy for the UI, or null (also null for a request the caller aborted). */
  errorMessage: string | null;
  reset: () => void;
};

type DetectVars = { input: DetectInput; signal?: AbortSignal };

/** An error the caller caused by aborting: nothing to show. */
export const isCancelled = (error: unknown): boolean =>
  (isApiError(error) && error.cancelled) || (error instanceof Error && error.name === 'AbortError');

/** User-safe copy for any error a screen catches (API errors get their kind's message). */
export const errorMessageOf = (error: unknown): string => toUserMessage(error);

/** Photos → detected items, written to `scanStore.setDetection` (and `detecting` while in flight). */
export function useDetectIngredients(): DetectView {
  const m = useMutation({
    mutationFn: ({ input, signal }: DetectVars) => getApi().detectIngredients(input, signal),
    onMutate: () => appStores.scan.getState().setDetecting(true),
    onSuccess: async (result, { signal }) => {
      // The reply raced the abort: the screen that asked is gone, so don't touch the session.
      if (signal?.aborted) return;
      await appStores.scan.getState().setDetection(result.items, result.warnings);
    },
    onSettled: () => appStores.scan.getState().setDetecting(false),
  });
  return {
    detect: (input, options) => m.mutate({ input, signal: options?.signal }),
    detectAsync: (input, options) => m.mutateAsync({ input, signal: options?.signal }),
    isPending: m.isPending,
    data: m.data,
    error: m.error,
    errorMessage: m.error && !isCancelled(m.error) ? toUserMessage(m.error) : null,
    reset: m.reset,
  };
}

/**
 * Scan → "Use demo photos": the mock backend's photo library. Mock mode only (`enabled` is
 * false in http mode, where the list would be empty anyway).
 */
export function useDemoPhotos(): QueryView<DemoPhoto[]> & { enabled: boolean } {
  const enabled = config.API_MODE === 'mock';
  return {
    ...view(
      useQuery({
        queryKey: queryKeys.demoPhotos,
        queryFn: () => listDemoPhotos(),
        enabled,
        staleTime: Infinity,
      }),
    ),
    enabled,
  };
}

/**
 * Recipes the backend suggests for the confirmed kitchen + preferences (`null` = don't fetch yet).
 * Rank them on-device with `rankSuggestions` (match %, filter chips, sort).
 */
export function useSuggestions(input: SuggestInput | null): QueryView<Recipe[]> {
  return view(
    useQuery({
      queryKey: input ? queryKeys.suggestions(input) : [...queryKeys.suggestionsAll, 'idle'],
      queryFn: ({ signal }) => getApi().suggestRecipes(input!, signal),
      enabled: input !== null,
      staleTime: HOUR_MS,
    }),
  );
}

/** A recipe already on hand: in a cached suggestions list, or a saved / cooked snapshot. */
export function knownRecipe(client: QueryClient, id: string): Recipe | undefined {
  for (const [, recipes] of client.getQueriesData<Recipe[]>({
    queryKey: queryKeys.suggestionsAll,
  })) {
    const hit = recipes?.find((r) => r.id === id);
    if (hit) return hit;
  }
  return appStores.cookbook.getState().snapshots[id];
}

/**
 * One recipe. Shows a known copy immediately (suggestions cache / cookbook snapshot), then
 * refreshes it from the backend; a refreshed saved / cooked recipe updates its snapshot.
 */
export function useRecipe(id: string | undefined): QueryView<Recipe> {
  const client = useQueryClient();
  return view(
    useQuery({
      queryKey: queryKeys.recipe(id ?? ''),
      queryFn: async ({ signal }) => {
        const recipe = await getApi().getRecipe(id!, signal);
        void appStores.cookbook.getState().refreshSnapshot(recipe);
        return recipe;
      },
      enabled: !!id,
      initialData: () => (id ? knownRecipe(client, id) : undefined),
      // The known copy may be old: treat it as stale so it refreshes once, then keep it 1 h.
      initialDataUpdatedAt: 0,
      staleTime: HOUR_MS,
    }),
  );
}

/**
 * Profile → "Reset demo data": wipes and reseeds the user database (re-hydrating the stores),
 * restores the mock backend's seed in mock mode, and drops every cached query.
 */
export function useResetDemoData(): () => Promise<void> {
  const client = useQueryClient();
  return async () => {
    await resetAll();
    try {
      await resetBackendData();
    } catch (error) {
      // The user's data is already reset; a mock-backend reset failure mustn't undo that.
      console.error('[reset] backend data', error);
    }
    client.clear();
  };
}
