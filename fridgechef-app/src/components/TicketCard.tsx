import { useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { DashedLine } from '@/components/DashedLine';
import { PressableScale } from '@/components/PressableScale';
import { colors, radii } from '@/theme/tokens';

export type TicketVariant = 'lime' | 'light' | 'white' | 'dark';

export type TicketCardProps = {
  top: ReactNode;
  bottom?: ReactNode;
  /** Top half. Default `lime`. */
  variant?: TicketVariant;
  /** Bottom half. Default `white`. */
  bottomVariant?: TicketVariant;
  /** Tighter padding (14 / 18 instead of 18 / 20). */
  compact?: boolean;
  /** Makes the whole card pressable (scale 0.985). Children may hold their own buttons. */
  onPress?: () => void;
  /** Accessibility label for the pressable card. */
  label?: string;
  testID?: string;
};

const R = radii.l; // outer corner radius
const NOTCH = 14; // seam notch radius

type Fill = { stops: [string, number][]; angle: number } | { solid: string };

// CSS: lime = linear-gradient(120deg, lime 35%, limeDeep); light = 180deg lightGrad;
// white = 180deg white → ticketWhiteEnd; dark = surface2.
const fills: Record<TicketVariant, Fill> = {
  lime: {
    angle: 120,
    stops: [
      [colors.lime, 0.35],
      [colors.limeDeep, 1],
    ],
  },
  light: {
    angle: 180,
    stops: [
      [colors.lightGrad[0], 0],
      [colors.lightGrad[1], 1],
    ],
  },
  white: {
    angle: 180,
    stops: [
      [colors.white, 0],
      [colors.ticketWhiteEnd, 1],
    ],
  },
  dark: { solid: colors.surface2 },
};

/**
 * Outline of one half: rounded outer corners and concave quarter-circle notches at the seam.
 * `seam` is the side the notches sit on. With no seam (a card without a bottom half) it is a
 * plain rounded rectangle.
 */
export function ticketPath(w: number, h: number, seam: 'bottom' | 'top' | 'none'): string {
  const n = NOTCH;
  if (seam === 'bottom') {
    return [
      `M0 ${R}`,
      `A${R} ${R} 0 0 1 ${R} 0`,
      `L${w - R} 0`,
      `A${R} ${R} 0 0 1 ${w} ${R}`,
      `L${w} ${h - n}`,
      `A${n} ${n} 0 0 0 ${w - n} ${h}`,
      `L${n} ${h}`,
      `A${n} ${n} 0 0 0 0 ${h - n}`,
      'Z',
    ].join(' ');
  }
  if (seam === 'top') {
    return [
      `M${n} 0`,
      `L${w - n} 0`,
      `A${n} ${n} 0 0 0 ${w} ${n}`,
      `L${w} ${h - R}`,
      `A${R} ${R} 0 0 1 ${w - R} ${h}`,
      `L${R} ${h}`,
      `A${R} ${R} 0 0 1 0 ${h - R}`,
      `L0 ${n}`,
      `A${n} ${n} 0 0 0 ${n} 0`,
      'Z',
    ].join(' ');
  }
  return [
    `M0 ${R}`,
    `A${R} ${R} 0 0 1 ${R} 0`,
    `L${w - R} 0`,
    `A${R} ${R} 0 0 1 ${w} ${R}`,
    `L${w} ${h - R}`,
    `A${R} ${R} 0 0 1 ${w - R} ${h}`,
    `L${R} ${h}`,
    `A${R} ${R} 0 0 1 0 ${h - R}`,
    'Z',
  ].join(' ');
}

/** CSS linear-gradient(angle) endpoints for a w×h box (gradient line through the centre). */
function gradientLine(w: number, h: number, angleDeg: number) {
  const a = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(a);
  const dy = -Math.cos(a);
  const half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  return {
    x1: w / 2 - dx * half,
    y1: h / 2 - dy * half,
    x2: w / 2 + dx * half,
    y2: h / 2 + dy * half,
  };
}

function Half({
  variant,
  seam,
  compact,
  children,
  id,
}: {
  variant: TicketVariant;
  seam: 'bottom' | 'top' | 'none';
  compact: boolean;
  children: ReactNode;
  id: string;
}) {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (!size || size.w !== width || size.h !== height) setSize({ w: width, h: height });
  };
  const fill = fills[variant];

  return (
    <View onLayout={onLayout} style={[styles.half, compact && styles.halfCompact]}>
      {size ? (
        <Svg style={[StyleSheet.absoluteFill, styles.noTouch]} width={size.w} height={size.h}>
          {'stops' in fill ? (
            <Defs>
              <LinearGradient
                id={id}
                gradientUnits="userSpaceOnUse"
                {...gradientLine(size.w, size.h, fill.angle)}
              >
                {fill.stops.map(([color, offset]) => (
                  <Stop key={offset} offset={offset} stopColor={color} />
                ))}
              </LinearGradient>
            </Defs>
          ) : null}
          <Path
            d={ticketPath(size.w, size.h, seam)}
            fill={'stops' in fill ? `url(#${id})` : fill.solid}
          />
        </Svg>
      ) : null}
      {seam === 'top' ? (
        <DashedLine
          color={variant === 'dark' ? colors.dash : colors.dashInk}
          thickness={1.5}
          dash={[5, 4]}
          style={styles.seam}
        />
      ) : null}
      {children}
    </View>
  );
}

let gradientIds = 0;

/** The signature two-part card: halves joined by semicircular notches and a dashed seam. */
export function TicketCard({
  top,
  bottom,
  variant = 'lime',
  bottomVariant = 'white',
  compact = false,
  onPress,
  label,
  testID,
}: TicketCardProps) {
  // Stable per-instance gradient ids (SVG ids are document-global on web).
  const [uid] = useState(() => `ticket${++gradientIds}`);
  const halves = (
    <>
      <Half variant={variant} seam={bottom ? 'bottom' : 'none'} compact={compact} id={`${uid}t`}>
        {top}
      </Half>
      {bottom ? (
        <Half variant={bottomVariant} seam="top" compact={compact} id={`${uid}b`}>
          {bottom}
        </Half>
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        pressedScale={0.985}
        style={styles.card}
        testID={testID}
      >
        {halves}
      </PressableScale>
    );
  }
  return (
    <View style={styles.card} testID={testID} accessibilityLabel={label}>
      {halves}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch' },
  half: { paddingVertical: 18, paddingHorizontal: 20 },
  halfCompact: { paddingVertical: 14, paddingHorizontal: 18 },
  seam: { position: 'absolute', top: 0, left: 24, right: 24 },
  noTouch: { pointerEvents: 'none' },
});
