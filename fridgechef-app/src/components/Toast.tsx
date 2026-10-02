import { AccessibilityInfo, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ToastMessage, { type ToastConfig } from 'react-native-toast-message';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { bodyFont } from '@/theme/fonts';
import { colors, radii, shadow } from '@/theme/tokens';

/** The lime pill (check + message). */
export function ToastPill({ message }: { message: string }) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[styles.pill, { maxWidth: width - 32 }]}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Icon name="check" size={16} color={colors.ink} strokeWidth={2.75} />
      <AppText style={styles.text}>{message}</AppText>
    </View>
  );
}

export const toastConfig: ToastConfig = {
  lime: ({ text1 }) => <ToastPill message={text1 ?? ''} />,
};

/**
 * Show the app toast (drops in under the status bar, hides after 2.2s). VoiceOver reads it too:
 * iOS doesn't announce a live region by itself, so the message is announced explicitly.
 */
export function showToast(message: string) {
  ToastMessage.show({ type: 'lime', text1: message, position: 'top', visibilityTime: 2200 });
  AccessibilityInfo.announceForAccessibility(message);
}

/** Mount once, last, in the root layout. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  return <ToastMessage config={toastConfig} topOffset={insets.top + 6} />;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: radii.pill,
    backgroundColor: colors.lime,
    boxShadow: shadow.float,
  },
  text: {
    flexShrink: 1,
    fontFamily: bodyFont(600),
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
});
