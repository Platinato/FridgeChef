import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { colors, radii, spacing } from '@/theme/tokens';

// Dev gallery only: realistic literals from the mockup's data.js (components never read seed data).
const U = (id: string, w = 600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const PHOTOS = {
  fridge: U('1571175443880-49e1d25b2bc5', 200),
  fridgeLarge: U('1571175443880-49e1d25b2bc5', 800),
  pantryShelf: U('1604719312566-8912e9227c6a', 800),
  spiceRack: U('1596040033229-a9821ebd058d', 800),
  vegetables: U('1540420773420-3366772f4999', 800),
  butterChicken: U('1603894584373-5ac82b2ae398', 900),
  palakPaneer: U('1631452180519-c014fe946bc7', 900),
  chicken: U('1604503468506-a8da13d82791', 200),
  paneer: U('1567188040759-fb8a883dc6d8', 200),
  yogurt: U('1488477181946-6428a0291777', 200),
};

export const BROKEN_PHOTO = 'https://invalid.example/missing.jpg';

export const noop = () => {};

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="micro">{title}</AppText>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** Stand-in for a photo so glass variants can be judged against something other than black. */
export function PhotoBackdrop({ children }: { children: ReactNode }) {
  return (
    <LinearGradient
      colors={colors.photoFade}
      locations={colors.photoFadeLocations}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.backdrop}
    >
      {children}
    </LinearGradient>
  );
}

const FRAME_INSETS = { top: 20, bottom: 20, left: 0, right: 0 };

/**
 * A phone-shaped box for demoing full-screen components (Screen, PhotoHero fill, BottomNav)
 * inside the scrolling gallery, with small fake safe-area insets.
 */
export function DeviceFrame({ height = 420, children }: { height?: number; children: ReactNode }) {
  return (
    <View style={[styles.frame, { height }]}>
      <SafeAreaInsetsContext.Provider value={FRAME_INSETS}>
        {children}
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing[3] },
  sectionBody: { gap: spacing[3] },
  backdrop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radii.l,
    backgroundColor: colors.limeDeep,
  },
  frame: {
    overflow: 'hidden',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bg,
  },
});
