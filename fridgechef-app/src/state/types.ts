import type { StoreApi } from 'zustand/vanilla';

import type { CookbookState } from './cookbookStore';
import type { PantryState } from './pantryStore';
import type { PrefsState } from './prefsStore';
import type { ProfileState } from './profileStore';
import type { ScanState } from './scanStore';

/** One set of wired-together stores. The app uses `appStores`; tests build their own. */
export type AppStores = {
  profile: StoreApi<ProfileState>;
  prefs: StoreApi<PrefsState>;
  pantry: StoreApi<PantryState>;
  scan: StoreApi<ScanState>;
  cookbook: StoreApi<CookbookState>;
};
