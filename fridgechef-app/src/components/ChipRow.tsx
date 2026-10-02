import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip, type ChipProps } from '@/components/Chip';
import { spacing } from '@/theme/tokens';

export type ChipRowItem = ChipProps & { key: string };

export type ChipRowProps = {
  chips: ChipRowItem[];
  /** Wrap onto several lines instead of scrolling horizontally. */
  wrap?: boolean;
  testID?: string;
};

/**
 * A row of Chips. By default it scrolls horizontally and bleeds past the right gutter
 * (the parent is expected to have the standard 16pt gutter); `wrap` flows onto lines.
 */
export function ChipRow({ chips, wrap = false, testID }: ChipRowProps) {
  const items = chips.map(({ key, ...chip }) => <Chip key={key} {...chip} />);
  if (wrap) {
    return (
      <View style={styles.wrap} testID={testID}>
        {items}
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      testID={testID}
    >
      {items}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { marginRight: -spacing.gutter, flexGrow: 0 },
  row: { gap: 8, paddingRight: spacing.gutter },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
