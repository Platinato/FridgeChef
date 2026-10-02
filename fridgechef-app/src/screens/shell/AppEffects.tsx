import { useEffect } from 'react';

import { OfflineBanner } from '@/components/OfflineBanner';
import { showToast } from '@/components/Toast';
import { useIsOffline } from '@/services/network';
import { useCatalog } from '@/services/queries';
import { appStores, setWriteErrorReporter } from '@/state';

/**
 * App-wide side effects, mounted once the stores are hydrated:
 * - a failed SQLite write-through shows a toast (replaces Sprint 04's dev-only report);
 * - the catalog loads once, and on an empty first launch (http mode) its default staples are
 *   added at 3 bars (once per install; mock mode already has the demo pantry).
 */
export function AppEffects() {
  const catalog = useCatalog();
  const offline = useIsOffline();
  const defaults = catalog.data?.defaultStaples;

  useEffect(() => {
    setWriteErrorReporter(() => showToast("Couldn't save that change"));
    return () => setWriteErrorReporter(null);
  }, []);

  useEffect(() => {
    if (defaults) void appStores.pantry.getState().applyDefaultStaples(defaults);
  }, [defaults]);

  return <OfflineBanner visible={offline} />;
}
