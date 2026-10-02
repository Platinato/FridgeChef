import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FallbackImage } from '@/components/FallbackImage';
import { colors, spacing } from '@/theme/tokens';

export type PhotoHeroProps = {
  uri?: string;
  /** What the photo shows (fallback initials, not announced). */
  alt: string;
  /** Height in pt. Default 440. Ignored with `fill`. */
  height?: number;
  /** Cover the whole screen (camera feed). */
  fill?: boolean;
  /** The dark-green fade at the bottom. Default true. */
  fade?: boolean;
  /** Overlay content (TopBar, titles), padded below the status bar and inside the gutters. */
  children?: ReactNode;
};

/**
 * Full-bleed photo with the dark-green fade (`colors.photoFade`) and an overlay
 * slot. Inside a Screen it bleeds past the 16pt gutters. Follow it with `HeroFadeContinuation`.
 */
export function PhotoHero({
  uri,
  alt,
  height = 440,
  fill = false,
  fade = true,
  children,
}: PhotoHeroProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={fill ? styles.fill : [styles.hero, { height }]}>
      <FallbackImage uri={uri} label={alt} initialsSize={64} style={StyleSheet.absoluteFill} />
      {fade ? (
        <LinearGradient
          colors={colors.photoFade}
          locations={colors.photoFadeLocations}
          style={[StyleSheet.absoluteFill, styles.noTouch]}
        />
      ) : null}
      <View style={[styles.content, { paddingTop: insets.top + 4 }]}>{children}</View>
    </View>
  );
}

export type HeroFadeContinuationProps = {
  children?: ReactNode;
  /** Vertical gap between children. Default 18 (onboarding uses 14). */
  gap?: number;
};

/**
 * The block right after a PhotoHero: overlaps it by 20pt and carries the green fade on into
 * the dark background over 220pt (mockup `.c-photohero__after`).
 */
export function HeroFadeContinuation({ children, gap = 18 }: HeroFadeContinuationProps) {
  return (
    <View style={[styles.after, { gap }]}>
      <LinearGradient colors={[colors.heroFadeEnd, colors.bg]} style={styles.afterFade} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: -spacing.gutter,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  content: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.gutter,
    paddingBottom: 22,
    pointerEvents: 'box-none',
  },
  noTouch: { pointerEvents: 'none' },
  after: {
    marginTop: -20,
    marginHorizontal: -spacing.gutter,
    paddingTop: 20,
    paddingHorizontal: spacing.gutter,
  },
  afterFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    pointerEvents: 'none',
  },
});
