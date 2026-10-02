import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon, type IconName } from '@/components/Icon';
import { bodyFont } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

export type CounterPillProps = {
  icon: IconName;
  value: string;
};

/** Icon + short count in white, no background ("12 items", "25 staples"). */
export function CounterPill({ icon, value }: CounterPillProps) {
  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={value}>
      <Icon name={icon} size={18} color={colors.white} />
      <AppText style={styles.value} numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  value: { fontFamily: bodyFont(600), fontSize: 14, lineHeight: 18, color: colors.white },
});
