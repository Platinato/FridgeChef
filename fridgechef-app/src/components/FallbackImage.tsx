import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { AppText, type TextColor } from '@/components/AppText';
import { colors } from '@/theme/tokens';

export type FallbackImageProps = {
  /** Remote or local uri. Missing or failing → initials tile. */
  uri?: string;
  /** What the image shows (e.g. "Fresh basil"); the fallback shows its initials. */
  label: string;
  /** Size, radius, border. The image fills this box. */
  style?: StyleProp<ViewStyle>;
  /** Initials font size. Default 18. */
  initialsSize?: number;
  /**
   * `gradient` (default): lime initials on the dark-green gradient (the mockup's offline fallback).
   * `plain`: grey initials on surface3 (IngredientRow thumbs without a photo).
   */
  fallback?: 'gradient' | 'plain';
  /** Blur radius, e.g. for blurry scan photos. */
  blurRadius?: number;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * Every photo in the app. Degrades to an initials tile when there is no uri or it fails to
 * load (offline), like the mockup's `img()` helper. Decorative: the parent carries the label.
 */
export function FallbackImage({
  uri,
  label,
  style,
  initialsSize = 18,
  fallback = 'gradient',
  blurRadius,
}: FallbackImageProps) {
  const [failed, setFailed] = useState(false);
  const flat = StyleSheet.flatten(style) ?? {};

  if (!uri || failed) {
    const color: TextColor = fallback === 'plain' ? 'text2' : 'lime';
    const text = (
      <AppText variant="display" color={color} size={initialsSize}>
        {initials(label)}
      </AppText>
    );
    return fallback === 'plain' ? (
      <View style={[styles.center, styles.plain, style]} testID="image-fallback">
        {text}
      </View>
    ) : (
      <LinearGradient
        colors={colors.imageFallbackGrad}
        locations={colors.imageFallbackGradLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.center, style, { overflow: 'hidden' }]}
        testID="image-fallback"
      >
        {text}
      </LinearGradient>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[styles.image, flat as ImageStyle]}
      contentFit="cover"
      // Memory + disk cache: photos survive navigation and app restarts (and work offline once seen).
      cachePolicy="memory-disk"
      transition={150}
      blurRadius={blurRadius}
      onError={() => setFailed(true)}
      testID="image-photo"
    />
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  plain: { backgroundColor: colors.surface3 },
  // The placeholder colour while a remote photo loads (a caller's own background wins).
  image: { overflow: 'hidden', backgroundColor: colors.surface2 },
});
