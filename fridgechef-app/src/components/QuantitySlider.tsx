import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Badge, type BadgeProps } from '@/components/Badge';
import { FallbackImage } from '@/components/FallbackImage';
import { haptics } from '@/components/haptics';
import { IconButton } from '@/components/IconButton';
import { PrimaryButton } from '@/components/PrimaryButton';
import { RangeSlider } from '@/components/RangeSlider';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Stepper, formatStepperValue } from '@/components/Stepper';
import { colors, radii, spacing } from '@/theme/tokens';

/** Detection confidence. `undefined` = added by the user. */
export type Confidence = 'high' | 'med' | 'low';

export type QuantitySliderProps = {
  name: string;
  thumb?: string;
  confidence?: Confidence;
  /** The user dragged, stepped or tapped "Looks right". */
  touched: boolean;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  /** Unit switch options (e.g. ["g", "kg"]). Omit for a single unit. */
  units?: string[];
  /** The detected estimate, shown as a bare-number tick. */
  estimate?: number;
  /** Committed value: on slider release and on every stepper press. */
  onChange?: (value: number) => void;
  /** Every tick while dragging (the card updates itself; the parent can ignore this). */
  onChanging?: (value: number) => void;
  onUnitChange?: (unit: string) => void;
  onRemove?: () => void;
  /** "Looks right" on a flagged item. */
  onConfirm?: () => void;
};

type Status = { kind: 'flagged' | 'confirmed' | 'confidence'; badge: BadgeProps };

/**
 * The gate logic: a low-confidence item stays flagged ("Please check") until touched; any
 * touched item shows "Confirmed"; otherwise the confidence label (never mentioning a machine).
 */
export function quantityStatus(confidence: Confidence | undefined, touched: boolean): Status {
  if (confidence === 'low' && !touched) {
    return {
      kind: 'flagged',
      badge: { label: 'Please check', dot: 'red', variant: 'alert', size: 'sm' },
    };
  }
  if (touched) {
    return {
      kind: 'confirmed',
      badge: { label: 'Confirmed', icon: 'check', variant: 'lime', size: 'sm' },
    };
  }
  const label =
    confidence === 'high'
      ? 'Sure'
      : confidence === 'med'
        ? 'Fairly sure'
        : confidence === 'low'
          ? 'Unsure'
          : 'Added by you';
  return { kind: 'confidence', badge: { label, variant: 'dark', size: 'sm' } };
}

/** The "confirm the real amount" card on the Confirm screen. */
export function QuantitySlider({
  name,
  thumb,
  confidence,
  touched,
  value,
  min,
  max,
  step,
  unit,
  units,
  estimate,
  onChange,
  onChanging,
  onUnitChange,
  onRemove,
  onConfirm,
}: QuantitySliderProps) {
  const [dragValue, setDragValue] = useState<number | null>(null);
  const live = dragValue ?? value;
  const status = quantityStatus(confidence, touched);
  const flagged = status.kind === 'flagged';

  return (
    <View
      style={[styles.card, flagged && styles.flagged, touched && styles.done]}
      testID={`qty-${name}`}
    >
      {flagged ? (
        <LinearGradient
          colors={[colors.qtyFlagTint, colors.qtyFlagTintEnd]}
          locations={[0, 0.55]}
          style={[StyleSheet.absoluteFill, styles.tint]}
        />
      ) : null}
      <View style={styles.head}>
        <FallbackImage uri={thumb} label={name} initialsSize={18} style={styles.thumb} />
        <View style={styles.title}>
          <AppText variant="display" size={22} numberOfLines={1} style={styles.name}>
            {name}
          </AppText>
          <Badge {...status.badge} />
        </View>
        <View
          style={styles.value}
          accessible
          accessibilityLabel={`${formatStepperValue(live)} ${unit}`}
        >
          <AppText variant="display" size={34} style={styles.valueNum} testID="qty-value">
            {formatStepperValue(live)}
          </AppText>
          <AppText variant="display" size={18} color="text2">
            {unit}
          </AppText>
        </View>
      </View>

      <RangeSlider
        bare
        min={min}
        max={max}
        step={step}
        value={value}
        label={`${name} quantity in ${unit}`}
        marker={
          estimate != null ? { value: estimate, label: formatStepperValue(estimate) } : undefined
        }
        minLabel={`${formatStepperValue(min)} ${unit}`}
        maxLabel={`${formatStepperValue(max)} ${unit}`}
        onChanging={(v) => {
          setDragValue(v);
          onChanging?.(v);
        }}
        onChange={(v) => {
          setDragValue(null);
          onChange?.(v);
        }}
      />

      <View style={styles.foot}>
        <Stepper
          value={value}
          min={min}
          max={max}
          step={step}
          label={name}
          hideValue
          onChange={onChange}
        />
        {units && units.length > 1 ? (
          <SegmentedControl
            size="sm"
            label={`${name} unit`}
            value={unit}
            onChange={onUnitChange}
            options={units.map((u) => ({ value: u, label: u }))}
          />
        ) : null}
        <View style={styles.grow} />
        <IconButton
          icon="trash"
          label={`Remove ${name}`}
          variant="ghost"
          size={40}
          onPress={onRemove}
        />
      </View>

      {flagged ? (
        <PrimaryButton
          label="Looks right"
          icon="check"
          variant="lime"
          size="sm"
          onPress={() => {
            haptics.tap();
            onConfirm?.();
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radii.l,
    backgroundColor: colors.surface2,
    borderWidth: 1.5,
    borderColor: colors.transparent,
  },
  flagged: { borderColor: colors.qtyFlagBorder },
  done: { borderColor: colors.qtyDoneBorder },
  tint: { borderRadius: radii.l, pointerEvents: 'none' },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  thumb: { width: 48, height: 48, borderRadius: radii.s },
  title: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: 5 },
  name: { lineHeight: 22, maxWidth: '100%' },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: 4, flexShrink: 0 },
  valueNum: { lineHeight: 34 },
  foot: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: 2 },
  grow: { flex: 1 },
});
