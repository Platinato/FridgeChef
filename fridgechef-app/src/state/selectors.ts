/** Derived state as plain functions of store state (the hooks in `hooks.ts` memoise these). */
import { lowStaples } from '@/domain/pantry';
import { pendingChecks } from '@/domain/scan';
import type { DetectedItem, Kitchen, Staple } from '@/domain/types';

import type { PantryState } from './pantryStore';
import type { ScanState } from './scanStore';

/** Confirmed scan items + remembered staples: the input to `match` / `rankSuggestions`. */
export const selectKitchen = (
  scan: Pick<ScanState, 'items'>,
  pantry: Pick<PantryState, 'staples' | 'autoInclude' | 'excluded'>,
): Kitchen => ({
  items: scan.items,
  staples: pantry.staples,
  autoInclude: pantry.autoInclude,
  excluded: pantry.excluded,
});

export const selectLowStaples = (pantry: Pick<PantryState, 'staples'>): Staple[] =>
  lowStaples(pantry.staples);

export const selectPendingChecks = (scan: Pick<ScanState, 'items'>): DetectedItem[] =>
  pendingChecks(scan.items);
