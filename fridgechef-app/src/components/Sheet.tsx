import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Children, useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { IconButton } from '@/components/IconButton';
import { colors, radii, spacing } from '@/theme/tokens';

export type SheetProps = {
  /** Controlled visibility. */
  open: boolean;
  /** Called after any dismissal: close button, backdrop tap, swipe down. */
  onClose: () => void;
  title: string;
  /** Scrollable body. */
  children?: ReactNode;
  /** Buttons row under the body; each child gets an equal share. */
  footer?: ReactNode;
  /** Fixed 80% height instead of sizing to content (long lists). */
  tall?: boolean;
};

const MAX = 0.8;
// Head (grab + title row) + footer allowance, subtracted from the 80% cap for the scroll body.
const CHROME = 150;

function Backdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.62}
      pressBehavior="close"
    />
  );
}

/**
 * The mockup's bottom sheet on `@gorhom/bottom-sheet` (`BottomSheetModal`): grab handle, big
 * display title, close button, scrollable body and an optional footer row. Needs the
 * `BottomSheetModalProvider` in the root layout.
 */
export function Sheet({ open, onClose, title, children, footer, tall = false }: SheetProps) {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  // Only dismiss on an open → closed transition; there is nothing to dismiss before the first present.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) ref.current?.present();
    else if (wasOpen.current) ref.current?.dismiss();
    wasOpen.current = open;
  }, [open]);

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={onClose}
      enableDynamicSizing={!tall}
      snapPoints={tall ? ['80%'] : undefined}
      maxDynamicContentSize={height * MAX}
      backdropComponent={Backdrop}
      backgroundStyle={styles.background}
      handleStyle={styles.handle}
      handleIndicatorStyle={styles.grab}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      accessibilityLabel={title}
    >
      {/* gorhom passes this style to StyleSheet.compose(), which takes a single style: flatten it. */}
      <BottomSheetView
        style={StyleSheet.flatten([
          styles.content,
          tall && styles.tall,
          { paddingBottom: insets.bottom + 6 },
        ])}
      >
        <View style={styles.head}>
          <AppText variant="display" size={36} accessibilityRole="header" style={styles.title}>
            {title}
          </AppText>
          <IconButton icon="close" label="Close" size={40} onPress={() => ref.current?.dismiss()} />
        </View>
        <BottomSheetScrollView
          style={tall ? styles.fill : { maxHeight: height * MAX - CHROME - insets.bottom }}
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </BottomSheetScrollView>
        {footer ? (
          <View style={styles.footer}>
            {Children.map(footer, (child) => (
              <View style={styles.footItem}>{child}</View>
            ))}
          </View>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handle: { paddingTop: 10, paddingBottom: 10 },
  grab: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.grabHandle },
  content: { paddingHorizontal: spacing.gutter },
  tall: { flex: 1 },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: 14,
  },
  title: { flex: 1, lineHeight: 36, paddingTop: 4 },
  body: { gap: 14, paddingBottom: spacing[2] },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 14 },
  fill: { flex: 1 },
  // CSS flex: 1 + nowrap keeps each button at least its content width; RN's flex: 1 (basis 0)
  // would split evenly and truncate ("Mark refi..."). Grow from the content width instead.
  footItem: { flexGrow: 1, flexBasis: 'auto' },
});
