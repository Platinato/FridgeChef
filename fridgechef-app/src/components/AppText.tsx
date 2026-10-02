import { Text, type TextProps, type TextStyle } from 'react-native';

import { bodyFont, fonts, type BodyWeight } from '@/theme/fonts';
import { colors, type } from '@/theme/tokens';

export type TextVariant = 'display' | 'bodyL' | 'body' | 'caption' | 'micro';
export type TextColor = 'text' | 'text2' | 'text3' | 'ink' | 'ink2' | 'lime' | 'alertText';

export type AppTextProps = TextProps & {
  /** Mirrors the mockup's `.t-*` utilities. Default `body`. */
  variant?: TextVariant;
  /** Defaults per variant: display / bodyL → text, body / caption → text2, micro → text. */
  color?: TextColor;
  /** Font size override in pt. Display text has no fixed size in the mockup, so pass one (default 34). */
  size?: number;
  /** Inter weight for body variants (ignored by `display`). */
  weight?: BodyWeight;
  align?: TextStyle['textAlign'];
};

const defaultColor: Record<TextVariant, TextColor> = {
  display: 'text',
  bodyL: 'text',
  body: 'text2',
  caption: 'text2',
  micro: 'text',
};

/** Line-height ratios from base.css (`.t-display` .9, `.t-body` 1.5, `.t-body-l` / `.t-caption` 1.45). */
function variantStyle(
  variant: TextVariant,
  size: number | undefined,
  weight: BodyWeight | undefined,
) {
  switch (variant) {
    case 'display': {
      const fontSize = size ?? type.displayM;
      return {
        fontFamily: fonts.display,
        fontSize,
        lineHeight: Math.round(fontSize * 0.9),
        textTransform: 'uppercase',
      } as const;
    }
    case 'bodyL': {
      const fontSize = size ?? type.bodyL;
      return {
        fontFamily: bodyFont(weight ?? 400),
        fontSize,
        lineHeight: Math.round(fontSize * 1.45),
      };
    }
    case 'body': {
      const fontSize = size ?? type.body;
      return {
        fontFamily: bodyFont(weight ?? 400),
        fontSize,
        lineHeight: Math.round(fontSize * 1.5),
      };
    }
    case 'caption': {
      const fontSize = size ?? type.caption;
      return {
        fontFamily: bodyFont(weight ?? 400),
        fontSize,
        lineHeight: Math.round(fontSize * 1.45),
      };
    }
    case 'micro': {
      const fontSize = size ?? type.micro;
      return {
        fontFamily: bodyFont(weight ?? 600),
        fontSize,
        letterSpacing: fontSize * 0.08,
        textTransform: 'uppercase',
        opacity: 0.6,
      } as const;
    }
  }
}

/**
 * Dynamic Type caps (Sprint 09). Display text is already 22-150pt and sits in fixed layouts, so it
 * barely grows; reading text may double; micro labels (pills, tabs) grow a little. Controls that
 * hold text use `minHeight`, so larger text grows the control instead of clipping.
 */
export const FONT_SCALE_CAP: Record<TextVariant, number> = {
  display: 1.1,
  bodyL: 2,
  body: 2,
  caption: 2,
  micro: 1.3,
};

/** The app's only text primitive (`<Text variant="…">` in the mockup's terms). */
export function AppText({
  variant = 'body',
  color,
  size,
  weight,
  align,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={FONT_SCALE_CAP[variant]}
      {...rest}
      style={[
        variantStyle(variant, size, weight),
        { color: colors[color ?? defaultColor[variant]] },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
