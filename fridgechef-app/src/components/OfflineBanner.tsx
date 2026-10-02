import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge } from '@/components/Badge';
import { spacing } from '@/theme/tokens';

export type OfflineBannerProps = { visible: boolean };

/** A small pill under the status bar while the phone has no connection. Never blocks touches. */
export function OfflineBanner({ visible }: OfflineBannerProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;
  return (
    <View
      style={[styles.wrap, { top: insets.top + spacing[1] }]}
      accessibilityLiveRegion="polite"
      testID="offline-banner"
    >
      {/* Badge aligns itself to flex-start; this wrapper is what gets centred. */}
      <View>
        <Badge
          label="You're offline · your pantry and saved recipes still work"
          dot="red"
          variant="dark"
          size="sm"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.gutter,
    right: spacing.gutter,
    zIndex: 50,
    alignItems: 'center',
    pointerEvents: 'none',
  },
});
