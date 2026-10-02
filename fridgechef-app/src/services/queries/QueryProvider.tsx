import { QueryClient, QueryClientProvider, type DefaultOptions } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * TanStack Query defaults for this app. `request()` already retries per the contract, so Query
 * never retries on top of it (that would multiply attempts). Tests pass `overrides`
 * (e.g. `gcTime: Infinity`, so no garbage-collection timer outlives the test).
 */
export function createQueryClient(overrides: DefaultOptions = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: 0, refetchOnWindowFocus: false, ...overrides.queries },
      mutations: { retry: 0, ...overrides.mutations },
    },
  });
}

/**
 * The app's client, used by the root layout's QueryProvider. App-level tests clear it after each
 * test (`appQueryClient.clear()`) so no cached query or gc timer leaks between tests.
 */
export const appQueryClient = createQueryClient();

/** Wrap the app (root layout). Hook tests pass their own `client`. */
export function QueryProvider({ children, client }: { children: ReactNode; client?: QueryClient }) {
  const [queryClient] = useState(() => client ?? appQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
