import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { FallbackImage } from '@/components/FallbackImage';
import { Icon } from '@/components/Icon';
import { PressableScale } from '@/components/PressableScale';
import { bodyFont } from '@/theme/fonts';
import { colors, shadow } from '@/theme/tokens';

export type ThumbPhoto = {
  id: string;
  uri: string;
  /** What's in it, e.g. "Fridge door" (fallback initials + labels). */
  label: string;
  /** Red ring + slight blur. */
  blurry?: boolean;
};

export type PhotoThumbStripProps = {
  photos: ThumbPhoto[];
  /** Show the remove × on each thumb. Default true. */
  removable?: boolean;
  onRemove?: (id: string) => void;
  /** Shows the dashed "+" tile (until `max` photos). */
  onAdd?: () => void;
  /** Default 6. */
  max?: number;
};

/** Captured photos as 64pt thumbs with a number, a remove × and a "+" tile. */
export function PhotoThumbStrip({
  photos,
  removable = true,
  onRemove,
  onAdd,
  max = 6,
}: PhotoThumbStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
      style={styles.scroll}
    >
      {photos.map((p, i) => (
        <View key={p.id} style={[styles.item, p.blurry && styles.blurry]}>
          <FallbackImage
            uri={p.uri}
            label={p.label}
            style={styles.img}
            blurRadius={p.blurry ? 1.5 : undefined}
          />
          <View style={styles.num}>
            <AppText style={styles.numText}>{i + 1}</AppText>
          </View>
          {removable ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Remove photo ${i + 1}`}
              onPress={() => onRemove?.(p.id)}
              hitSlop={10}
              style={styles.remove}
            >
              <Icon name="close" size={12} color={colors.ink} strokeWidth={3} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {onAdd && photos.length < max ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Add photos from gallery"
          onPress={onAdd}
          style={styles.add}
        >
          <Icon name="plus" size={22} color={colors.white} />
        </PressableScale>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  // Room above / right for the × that sits outside each thumb.
  strip: { gap: 12, paddingTop: 10, paddingRight: 10, paddingBottom: 4, paddingLeft: 2 },
  item: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.thumbBorder,
  },
  blurry: { borderColor: colors.alert },
  img: { width: '100%', height: '100%', borderRadius: 16 },
  num: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.thumbNumBg,
  },
  numText: { fontFamily: bodyFont(700), fontSize: 11, lineHeight: 13, color: colors.white },
  remove: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    boxShadow: shadow.small,
  },
  add: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.addTileBorder,
    backgroundColor: colors.addTileBg,
  },
});
