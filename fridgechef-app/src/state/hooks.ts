/** React hooks over `appStores`. Screens read state only through these (never `src/db`). */
import { useMemo } from 'react';
import { useStore } from 'zustand';

import type { DetectedItem, Kitchen, Staple } from '@/domain/types';

import type { CookbookState } from './cookbookStore';
import { appStores } from './appStores';
import type { PantryState } from './pantryStore';
import type { PrefsState } from './prefsStore';
import type { ProfileState } from './profileStore';
import type { ScanState } from './scanStore';
import { selectKitchen, selectLowStaples, selectPendingChecks } from './selectors';

// Select the smallest slice you need; a selector that builds a new object or array on every
// call re-renders forever. Derive with the hooks below (memoised) instead.
export const useProfileStore = <T>(selector: (s: ProfileState) => T): T =>
  useStore(appStores.profile, selector);
export const usePrefsStore = <T>(selector: (s: PrefsState) => T): T =>
  useStore(appStores.prefs, selector);
export const usePantryStore = <T>(selector: (s: PantryState) => T): T =>
  useStore(appStores.pantry, selector);
export const useScanStore = <T>(selector: (s: ScanState) => T): T =>
  useStore(appStores.scan, selector);
export const useCookbookStore = <T>(selector: (s: CookbookState) => T): T =>
  useStore(appStores.cookbook, selector);

/** Staples at or below 1.5 bars (Home's "running low", the bell dot). */
export function useLowStaples(): Staple[] {
  const staples = usePantryStore((s) => s.staples);
  return useMemo(() => selectLowStaples({ staples }), [staples]);
}

/** Low-confidence items still to check; recipes wait until this is empty. */
export function usePendingChecks(): DetectedItem[] {
  const items = useScanStore((s) => s.items);
  return useMemo(() => selectPendingChecks({ items }), [items]);
}

/** Scan items + staples + inclusion: pass to `match` / `rankSuggestions`. */
export function useKitchen(): Kitchen {
  const items = useScanStore((s) => s.items);
  const staples = usePantryStore((s) => s.staples);
  const autoInclude = usePantryStore((s) => s.autoInclude);
  const excluded = usePantryStore((s) => s.excluded);
  return useMemo(
    () => selectKitchen({ items }, { staples, autoInclude, excluded }),
    [items, staples, autoInclude, excluded],
  );
}
