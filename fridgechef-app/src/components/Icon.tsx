import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { iconShapes, type IconName, type IconShape } from '@/theme/icons';
import { colors } from '@/theme/tokens';

export type { IconName } from '@/theme/icons';

export type IconProps = {
  name: IconName;
  /** Width and height in pt. Default 20. */
  size?: number;
  /** Default white (`colors.text`). */
  color?: string;
  /** Default 1.75, like the mockup's line-icon set. */
  strokeWidth?: number;
};

/** Line icon on a 24px grid. Decorative: the pressable around it carries the label. */
export function Icon({ name, size = 20, color = colors.text, strokeWidth = 1.75 }: IconProps) {
  const shapes: readonly IconShape[] = iconShapes[name];
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      testID={`icon-${name}`}
    >
      {shapes.map((shape, i) => {
        const fill = shape.filled ? color : 'none';
        switch (shape.type) {
          case 'path':
            return <Path key={i} d={shape.d} fill={fill} />;
          case 'circle':
            return <Circle key={i} cx={shape.cx} cy={shape.cy} r={shape.r} fill={fill} />;
          case 'rect':
            return (
              <Rect
                key={i}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                rx={shape.rx}
                fill={fill}
              />
            );
        }
      })}
    </Svg>
  );
}
