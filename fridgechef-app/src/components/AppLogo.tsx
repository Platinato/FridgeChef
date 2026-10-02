import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { View } from 'react-native';

import { colors } from '@/theme/tokens';

export type AppLogoProps = {
  /** Diameter in pt. Default 48. */
  size?: number;
};

/** Lime disc with a chef hat carrying a check swoosh. */
export function AppLogo({ size = 48 }: AppLogoProps) {
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="FridgeChef">
      <Svg width={size} height={size} viewBox="0 0 48 48">
        <Circle cx={24} cy={24} r={24} fill={colors.lime} />
        <G fill={colors.ink}>
          <Circle cx={16.5} cy={20.5} r={6} />
          <Circle cx={24} cy={16.5} r={7.5} />
          <Circle cx={31.5} cy={20.5} r={6} />
          <Rect x={14.5} y={20} width={19} height={10} />
          <Rect x={15} y={31.5} width={18} height={5} rx={1.8} />
        </G>
        <Path
          d="M18.8 23.8l3.8 3.8 7.2-7.4"
          fill="none"
          stroke={colors.lime}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
