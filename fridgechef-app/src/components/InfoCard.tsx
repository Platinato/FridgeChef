import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { DashedLine } from '@/components/DashedLine';
import { Disc, type DiscVariant } from '@/components/Disc';
import type { IconName } from '@/components/Icon';
import { bodyFont } from '@/theme/fonts';
import { colors, radii, spacing } from '@/theme/tokens';

export type InfoCardVariant = 'dark' | 'lime' | 'glass' | 'alert';

export type InfoCardProps = {
  title: string;
  body?: string;
  /** Icon in a 40pt disc on the left. */
  icon?: IconName;
  variant?: InfoCardVariant;
  /** Control on the right, vertically centred. */
  right?: ReactNode;
  /** Row under a dashed rule (e.g. a Toggle). */
  footer?: ReactNode;
};

const variantStyle: Record<
  InfoCardVariant,
  { box: ViewStyle; title: string; body: string; disc: DiscVariant; dash: string }
> = {
  dark: {
    box: { backgroundColor: colors.surface1, borderWidth: 1, borderColor: colors.border },
    title: colors.text,
    body: colors.text2,
    disc: 'lime',
    dash: colors.dash,
  },
  lime: {
    box: { backgroundColor: colors.lime },
    title: colors.ink,
    body: colors.ink2,
    disc: 'ink',
    dash: colors.dashInk,
  },
  // No backdrop blur (D21) - translucent fill only.
  glass: {
    box: {
      backgroundColor: colors.infoGlassBg,
      borderWidth: 1,
      borderColor: colors.infoGlassBorder,
    },
    title: colors.text,
    body: colors.text2,
    disc: 'lime',
    dash: colors.dash,
  },
  alert: {
    box: {
      backgroundColor: colors.infoAlertBg,
      borderWidth: 1,
      borderColor: colors.infoAlertBorder,
    },
    title: colors.text,
    body: colors.infoAlertText,
    disc: 'dark',
    dash: colors.dash,
  },
};

/** Icon disc + title / body, with optional right control and footer row. */
export function InfoCard({ title, body, icon, variant = 'dark', right, footer }: InfoCardProps) {
  const v = variantStyle[variant];
  return (
    <View style={[styles.card, v.box]}>
      <View style={styles.row}>
        {icon ? <Disc icon={icon} size={40} variant={v.disc} ring={false} /> : null}
        <View
          style={styles.text}
          accessible
          accessibilityLabel={body ? `${title}. ${body}` : title}
        >
          <AppText style={[styles.title, { color: v.title }]}>{title}</AppText>
          {body ? <AppText style={[styles.body, { color: v.body }]}>{body}</AppText> : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {footer ? (
        <View style={styles.footer}>
          <DashedLine color={v.dash} style={styles.rule} />
          {footer}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing[3], padding: spacing[4], borderRadius: radii.l },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  text: { flex: 1, minWidth: 0 },
  title: { fontFamily: bodyFont(600), fontSize: 15, lineHeight: 20 },
  body: { marginTop: 3, fontSize: 13, lineHeight: 19 },
  right: { alignSelf: 'center' },
  footer: { paddingTop: spacing[3] },
  rule: { position: 'absolute', top: 0, left: 0, right: 0 },
});
