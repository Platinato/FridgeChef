import { StyleSheet, View, type ViewStyle } from 'react-native';

import { FallbackImage } from '@/components/FallbackImage';
import { ScanOverlay } from '@/components/ScanOverlay';
import { colors, radii, shadow } from '@/theme/tokens';

export type StackPhoto = { id: string; uri: string; label: string };

export type PhotoStackProps = {
  /** The first three are shown; the first one is on top. */
  photos: StackPhoto[];
  /** Sweep the scan line over the top photo. */
  scanning?: boolean;
};

// Depth 0 = on top. CSS: --1 rotate(-6deg) translate(-14px, 8px); --2 rotate(6deg) translate(14px, 10px).
const fan: ViewStyle[] = [
  {},
  { transform: [{ rotate: '-6deg' }, { translateX: -14 }, { translateY: 8 }] },
  { transform: [{ rotate: '6deg' }, { translateX: 14 }, { translateY: 10 }] },
];

/** Up to three photos fanned like cards; the top one carries the scan overlay. */
export function PhotoStack({ photos, scanning = false }: PhotoStackProps) {
  const shown = photos.slice(0, 3);
  return (
    <View style={styles.stack} accessibilityLabel={`${shown.length} photos`} accessible>
      {/* Paint back to front: the deepest card first. */}
      {shown
        .map((p, depth) => ({ p, depth }))
        .reverse()
        .map(({ p, depth }) => (
          <View key={p.id} style={[styles.card, fan[depth]]}>
            {/* Shadow on the outer view, clipping on the inner one (iOS clips shadows with overflow). */}
            <View style={styles.clip}>
              <FallbackImage uri={p.uri} label={p.label} initialsSize={48} style={styles.img} />
              {depth === 0 ? <ScanOverlay sweeping={scanning} inset={14} /> : null}
            </View>
          </View>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { height: 300, marginHorizontal: 28, marginTop: 6 },
  card: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: radii.l,
    boxShadow: shadow.stack,
  },
  clip: {
    flex: 1,
    borderRadius: radii.l,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.white,
    backgroundColor: colors.surface2,
  },
  img: { width: '100%', height: '100%' },
});
