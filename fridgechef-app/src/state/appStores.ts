import { createCookbookStore } from './cookbookStore';
import { createPantryStore } from './pantryStore';
import { createPrefsStore } from './prefsStore';
import { createProfileStore } from './profileStore';
import { createScanStore } from './scanStore';
import type { AppStores } from './types';

/** Builds a fresh, wired-together set of stores (the app has one; tests build more). */
export function createAppStores(): AppStores {
  const stores = {} as AppStores;
  const app = () => stores;
  stores.profile = createProfileStore(app);
  stores.prefs = createPrefsStore();
  stores.pantry = createPantryStore(app);
  stores.scan = createScanStore();
  stores.cookbook = createCookbookStore();
  return stores;
}

/** The app's stores. */
export const appStores: AppStores = createAppStores();

/** Loads every store from its repository. Call after `initDatabase()`. */
export async function hydrateStores(stores: AppStores = appStores): Promise<void> {
  await Promise.all([
    stores.profile.getState().hydrate(),
    stores.prefs.getState().hydrate(),
    stores.pantry.getState().hydrate(),
    stores.scan.getState().hydrate(),
    stores.cookbook.getState().hydrate(),
  ]);
}
