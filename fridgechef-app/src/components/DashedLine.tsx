import { useState } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/theme/tokens';

export type DashedLineProps = {
  /** Default `colors.dash` (on dark). Use `colors.dashInk` on lime / light surfaces. */
  color?: string;
  /** Stroke width in pt. Default 1. */
  thickness?: number;
  /** Dash and gap lengths. Default [4, 4]. */
  dash?: [number, number];
  /** Horizontal (default) or vertical. */
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * A dashed rule. RN can't dash a single border side reliably on iOS, so every
 * `border-top: 1px dashed` in the mockup becomes one of these.
 */
export function DashedLine({
  color = colors.dash,
  thickness = 1,
  dash = [4, 4],
  vertical = false,
  style,
}: DashedLineProps) {
  const [length, setLength] = useState(0);
  return (
    <View
      style={[
        vertical ? { width: thickness, alignSelf: 'stretch' } : { height: thickness },
        { pointerEvents: 'none' },
        style,
      ]}
      onLayout={(e) =>
        setLength(vertical ? e.nativeEvent.layout.height : e.nativeEvent.layout.width)
      }
    >
      {length > 0 ? (
        <Svg width={vertical ? thickness : length} height={vertical ? length : thickness}>
          <Line
            x1={vertical ? thickness / 2 : 0}
            y1={vertical ? 0 : thickness / 2}
            x2={vertical ? thickness / 2 : length}
            y2={vertical ? length : thickness / 2}
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={dash}
          />
        </Svg>
      ) : null}
    </View>
  );
}
