/**
 * Light haptics (Sprint 09): shutter, "Looks right", toggles, the cook timer at 0. A no-op on
 * web, and a failure never surfaces (haptics are a nicety). Not a component: a helper the
 * components and screens share.
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const run = (fire: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  try {
    void fire().catch(() => undefined);
  } catch {
    // Module unavailable (e.g. a test environment): ignore.
  }
};

export const haptics = {
  /** A light tap: shutter, "Looks right". */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** A selection tick: switches. */
  selection: () => run(() => Haptics.selectionAsync()),
  /** Something finished: the cook timer reaching 0. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
