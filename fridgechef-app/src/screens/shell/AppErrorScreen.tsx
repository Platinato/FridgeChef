import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { colors, spacing } from '@/theme/tokens';

/**
 * The app-level error boundary's fallback (exported as `ErrorBoundary` from the root layout).
 * It may render in place of the root providers, so it brings its own safe-area provider and
 * stays plain. "Restart" re-renders the app; nothing on the phone is touched.
 */
export function AppErrorScreen({ error, onRestart }: { error?: Error; onRestart: () => void }) {
  useEffect(() => {
    if (error) console.error('[app] render error', error);
  }, [error]);
  return (
    <SafeAreaProvider>
      <View style={styles.root} testID="app-error">
        <EmptyState
          icon="alert"
          title="Something went wrong"
          body="FridgeChef hit a snag. Your pantry and saved recipes are safe on this phone."
          actions={[{ label: 'Restart', variant: 'lime', onPress: onRestart }]}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.gutter,
    backgroundColor: colors.bg,
  },
});
