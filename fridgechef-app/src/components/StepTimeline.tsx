import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { colors, spacing } from '@/theme/tokens';

export type TimelineStep = { text: string; minutes: number };

export type StepTimelineProps = {
  steps: TimelineStep[];
  /** 0-based index of the highlighted step. Default 0. */
  active?: number;
};

const NODE = 36;

/**
 * The mockup's curved connector (`M12 0 C 28 30, -4 62, 12 100` on a 24×100 box), scaled to
 * the real height so the 1.5pt dashed stroke is never stretched.
 */
export const connectorPath = (h: number) => `M12 0 C 28 ${0.3 * h}, -4 ${0.62 * h}, 12 ${h}`;

/** Numbered nodes linked by curved dashed connectors; each step has a time badge. */
export function StepTimeline({ steps, active = 0 }: StepTimelineProps) {
  return (
    <View accessibilityRole="list">
      {steps.map((s, i) => (
        <Step
          key={i}
          index={i}
          step={s}
          on={i === active}
          last={i === steps.length - 1}
          total={steps.length}
        />
      ))}
    </View>
  );
}

function Step({
  index,
  step,
  on,
  last,
  total,
}: {
  index: number;
  step: TimelineStep;
  on: boolean;
  last: boolean;
  total: number;
}) {
  const [height, setHeight] = useState(0);
  // The link starts 4pt under the node and stops 4pt above the next one (CSS: top 40, height 100% - 44).
  const linkH = Math.max(0, height - 44);
  return (
    <View
      style={styles.item}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      accessible
      accessibilityLabel={`Step ${index + 1} of ${total}: ${step.text}. ${step.minutes} minutes`}
    >
      <View style={styles.rail}>
        <View style={[styles.node, on && styles.nodeOn]}>
          <AppText variant="display" size={20} color={on ? 'ink' : 'text'} style={styles.num}>
            {index + 1}
          </AppText>
        </View>
        {!last && linkH > 0 ? (
          <Svg width={24} height={linkH} style={styles.link} testID="step-link">
            <Path
              d={connectorPath(linkH)}
              fill="none"
              stroke={colors.stepLink}
              strokeWidth={1.5}
              strokeDasharray={[4, 4]}
            />
          </Svg>
        ) : null}
      </View>
      <View style={styles.body}>
        <AppText variant="body" color="text">
          {step.text}
        </AppText>
        <Badge label={`${step.minutes} min`} icon="clock" variant="dark" size="sm" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'stretch', gap: 14 },
  rail: { width: NODE, alignItems: 'center' },
  node: {
    zIndex: 1,
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface3,
    borderWidth: 1.5,
    borderColor: colors.nodeBorder,
  },
  nodeOn: { backgroundColor: colors.lime, borderColor: colors.lime },
  num: { lineHeight: 20, paddingTop: 3 },
  link: { position: 'absolute', top: 40, left: 6 },
  body: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingTop: 6,
    paddingBottom: spacing[6],
  },
});
