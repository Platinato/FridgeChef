import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Icon } from '@/components/Icon';
import { PressableScale, touchSlop } from '@/components/PressableScale';
import { colors, radii } from '@/theme/tokens';

export type StepperProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Receives the already-clamped next value. */
  onChange?: (next: number) => void;
  /** Accessibility label for the group, e.g. "Servings". Default "Quantity". */
  label?: string;
  /** Small grey unit after the value. */
  unit?: string;
  /** Buttons only (the value is shown elsewhere). */
  hideValue?: boolean;
  testID?: string;
};

/** Next value one step down / up, rounded to 2 decimals and clamped (mockup Stepper maths). */
export function stepValue(
  value: number,
  step: number,
  direction: -1 | 1,
  min: number,
  max: number,
) {
  const next = +(value + direction * step).toFixed(2);
  return direction < 0 ? Math.max(min, next) : Math.min(max, next);
}

/** Display format: at most 2 decimals, no trailing zeros (mockup `fmtNum`). */
export const formatStepperValue = (n: number) => String(Math.round(n * 100) / 100);

/** − value + control. */
export function Stepper({
  value,
  min = 0,
  max = 99,
  step = 1,
  onChange,
  label = 'Quantity',
  unit,
  hideValue = false,
  testID,
}: StepperProps) {
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <View style={styles.pill} testID={testID}>
      <StepButton
        icon="minus"
        label={`Decrease ${label}`}
        disabled={atMin}
        onPress={() => onChange?.(stepValue(value, step, -1, min, max))}
      />
      {hideValue ? null : (
        <View style={styles.value}>
          <AppText variant="display" size={26} style={styles.number}>
            {formatStepperValue(value)}
          </AppText>
          {unit ? (
            <AppText variant="caption" size={12}>
              {unit}
            </AppText>
          ) : null}
        </View>
      )}
      <StepButton
        icon="plus"
        label={`Increase ${label}`}
        disabled={atMax}
        onPress={() => onChange?.(stepValue(value, step, 1, min, max))}
      />
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'minus' | 'plus';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      pressedScale={0.92}
      hitSlop={touchSlop(40)}
      style={[styles.btn, disabled && styles.btnDisabled]}
    >
      <Icon name={icon} size={18} color={colors.white} strokeWidth={2.25} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    flexShrink: 0,
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.surface3,
  },
  btn: {
    width: 40,
    minHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface1,
  },
  btnDisabled: { opacity: 0.35 },
  value: {
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 3,
  },
  number: { lineHeight: 26, paddingTop: 3 },
});
