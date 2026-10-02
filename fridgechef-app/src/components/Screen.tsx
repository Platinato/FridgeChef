import { LinearGradient } from 'expo-linear-gradient';
import { Children, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navBottomOffset } from '@/components/BottomNav';
import { colors, nav, radii, spacing } from '@/theme/tokens';

export type ScreenFooterVariant = 'default' | 'lime' | 'row' | 'clear';

export type ScreenProps = {
  children?: ReactNode;
  /** Sticky footer (usually the screen's CTA). */
  footer?: ReactNode;
  /**
   * `default`: dark fade behind the CTA. `lime`: lime slab with a rounded top (recipe detail).
   * `row`: children side by side (cook mode Back / Next). `clear`: no background (camera).
   */
  footerVariant?: ScreenFooterVariant;
  /** Leave room for the floating BottomNav (rendered by the tab navigator, not here). */
  withNav?: boolean;
  /** Rendered last, above everything (sheets, flashes). */
  overlay?: ReactNode;
  /** No top padding: the first child is a full-bleed hero. */
  flush?: boolean;
  /** `false` = a fixed, non-scrolling body (camera). Default true. */
  scroll?: boolean;
  testID?: string;
};

const FOOTER_FALLBACK_HEIGHT = 124;

/**
 * The shell every screen renders into: safe areas, a scroll body with 16pt gutters and a 20pt
 * gap, a status-bar scrim, an optional sticky footer and room for the floating nav.
 */
export function Screen({
  children,
  footer,
  footerVariant = 'default',
  withNav = false,
  overlay,
  flush = false,
  scroll = true,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const [footerHeight, setFooterHeight] = useState(FOOTER_FALLBACK_HEIGHT);

  const paddingBottom = footer
    ? footerHeight + spacing[2]
    : withNav
      ? navBottomOffset(insets.bottom) + nav.height + nav.gapAbove
      : spacing[8] + insets.bottom;

  const bodyStyle = [styles.body, { paddingTop: flush ? 0 : insets.top + 4, paddingBottom }];

  const footerChildren =
    footerVariant === 'row'
      ? Children.map(footer, (child) => <View style={styles.rowItem}>{child}</View>)
      : footer;

  return (
    <View style={styles.root} testID={testID}>
      {scroll ? (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={bodyStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, styles.fixed, bodyStyle]}>{children}</View>
      )}

      {/* Keeps content scrolling under the status bar legible. */}
      <LinearGradient
        colors={[colors.statusScrim, colors.bgClear]}
        locations={[0.55, 1]}
        style={[styles.scrim, { height: insets.top + 8 }]}
      />

      {footer ? (
        <View
          testID="screen-footer"
          onLayout={(e) => setFooterHeight(Math.round(e.nativeEvent.layout.height))}
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + 6 },
            footerVariant === 'row' && styles.footerRow,
            footerVariant === 'lime' && styles.footerLime,
          ]}
        >
          {footerVariant === 'default' || footerVariant === 'row' ? (
            <LinearGradient
              colors={[colors.bgClear, colors.bg]}
              locations={[0, 0.42]}
              style={[StyleSheet.absoluteFill, styles.noTouch]}
            />
          ) : null}
          {footerChildren}
        </View>
      ) : null}

      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  fill: { flex: 1 },
  fixed: { overflow: 'hidden' },
  body: { paddingHorizontal: spacing.gutter, gap: spacing[5] },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 15, pointerEvents: 'none' },
  noTouch: { pointerEvents: 'none' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    gap: 10,
    paddingTop: 28,
    paddingHorizontal: spacing.gutter,
  },
  footerRow: { flexDirection: 'row' },
  footerLime: {
    backgroundColor: colors.lime,
    borderTopLeftRadius: radii.l,
    borderTopRightRadius: radii.l,
    paddingTop: spacing[4],
  },
  // CSS `flex: 1` items can't shrink below their content (min-width: auto); RN's can, which
  // truncated "Done cooking". Grow from the content width instead (as Sheet footers do, D42).
  rowItem: { flexGrow: 1, flexBasis: 'auto' },
});
