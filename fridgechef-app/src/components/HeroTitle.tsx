import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { fonts } from '@/theme/fonts';
import { colors, type as typeScale } from '@/theme/tokens';

export type HeroTitleProps = {
  /** Small grey line above, e.g. "Explore". */
  kicker: string;
  /** Huge display word, e.g. "Recipes" (rendered uppercase). */
  title: string;
  /** Font size of the title in pt. Default 84. */
  size?: number;
  /** Optional slot on the right, bottom-aligned (counters, avatars). */
  right?: ReactNode;
};

/**
 * The signature two-line header: grey kicker over a huge condensed title with a
 * white → light grey vertical gradient (`colors.heroTitleGrad`, via MaskedView + LinearGradient). On web, MaskedView only
 * renders the mask, so the title shows as plain white there.
 */
export function HeroTitle({ kicker, title, size = typeScale.displayXL, right }: HeroTitleProps) {
  const titleStyle = [styles.title, { fontSize: size, lineHeight: Math.round(size * 0.86) }];
  return (
    <View style={styles.row}>
      <View
        style={styles.text}
        accessible
        accessibilityRole="header"
        accessibilityLabel={`${kicker} ${title}`}
      >
        <AppText style={styles.kicker}>{kicker}</AppText>
        <MaskedView
          maskElement={
            <AppText style={titleStyle} importantForAccessibility="no">
              {title}
            </AppText>
          }
        >
          <LinearGradient colors={colors.heroTitleGrad} locations={colors.heroTitleGradLocations}>
            {/* Invisible copy sizes the gradient to the text. */}
            <AppText style={[titleStyle, styles.sizer]} importantForAccessibility="no">
              {title}
            </AppText>
          </LinearGradient>
        </MaskedView>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  text: { flexShrink: 1, minWidth: 0 },
  kicker: {
    fontSize: 28,
    lineHeight: 31,
    letterSpacing: -0.56,
    color: colors.text2,
  },
  title: {
    marginTop: 2,
    fontFamily: fonts.display,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    // The mask only uses alpha; white keeps the web fallback readable.
    color: colors.white,
  },
  sizer: { opacity: 0 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, flexShrink: 0 },
});
