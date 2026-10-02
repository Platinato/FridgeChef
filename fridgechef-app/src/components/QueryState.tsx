import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { colors, radii, spacing } from '@/theme/tokens';

export type QueryStateProps = {
  /** First load, nothing to show yet: render the placeholder. */
  loading: boolean;
  /** Short user-facing copy (`toUserMessage` / a query hook's `errorMessage`); null = no error. */
  errorMessage: string | null;
  onRetry: () => void;
  /** Rendered once there is data. */
  children: ReactNode;
  /** Placeholder shape: a row of chip pills, or stacked blocks. Default `blocks`. */
  placeholder?: 'chips' | 'blocks';
  /** Blocks only: how many and how tall. Default 3 × 56. */
  blocks?: number;
  blockHeight?: number;
  /** Error card headline. Default "Couldn't load this". */
  errorTitle?: string;
};

/**
 * The app's loading / error convention for anything fetched (Sprint 06): a static placeholder
 * while loading, an EmptyState with "Try again" on error, otherwise the children. Presentational:
 * the screen passes the query hook's `isLoading` / `errorMessage` / `refetch` in.
 */
export function QueryState({
  loading,
  errorMessage,
  onRetry,
  children,
  placeholder = 'blocks',
  blocks = 3,
  blockHeight = 56,
  errorTitle = "Couldn't load this",
}: QueryStateProps) {
  if (errorMessage) {
    return (
      <EmptyState
        icon="alert"
        title={errorTitle}
        body={errorMessage}
        actions={[{ label: 'Try again', variant: 'lime', onPress: onRetry }]}
      />
    );
  }
  if (loading) {
    return (
      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        testID="query-loading"
        style={placeholder === 'chips' ? styles.chips : styles.blocks}
      >
        {placeholder === 'chips'
          ? [96, 72, 120, 84].map((w) => <View key={w} style={[styles.chip, { width: w }]} />)
          : Array.from({ length: blocks }, (_, i) => (
              <View key={i} style={[styles.block, { height: blockHeight }]} />
            ))}
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', gap: spacing[2], overflow: 'hidden' },
  chip: { height: 44, borderRadius: radii.pill, backgroundColor: colors.surface2 },
  blocks: { gap: spacing[2] },
  block: { borderRadius: radii.m, backgroundColor: colors.surface1 },
});
