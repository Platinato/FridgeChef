/**
 * Connectivity (Sprint 09). The banner shows in both modes; only http mode ties TanStack Query to
 * it (queries pause offline and refetch on reconnect). Mock mode's "backend" is the on-device
 * database, so it keeps working offline and must never pause.
 */
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

import { config, type Config } from '@/services/config';

/** No connection at all (unknown counts as online, so the banner never flashes at launch). */
export const isOfflineState = (state: { isConnected: boolean | null }): boolean =>
  state.isConnected === false;

/** Call once at startup. Returns whether the query layer now follows the device's connection. */
export function connectOnlineManager(cfg: Config = config): boolean {
  if (cfg.API_MODE !== 'http') return false;
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(!isOfflineState(state))),
  );
  return true;
}

/** For the offline banner. */
export function useIsOffline(): boolean {
  return isOfflineState(useNetInfo());
}
