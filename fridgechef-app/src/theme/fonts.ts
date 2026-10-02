// Import each weight from its own entry point: the package index would bundle all 18 Inter files.
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue/400Regular';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';

/** Passed to `useFonts` in the root layout. The keys become the font family names. */
export const fontAssets = {
  BebasNeue_400Regular,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
};

export type BodyWeight = 400 | 500 | 600 | 700;

/**
 * Font roles. Custom fonts on iOS ignore `fontWeight`, so every weight is its own family:
 * always pick the family here instead of setting `fontWeight`.
 */
export const fonts = {
  display: 'BebasNeue_400Regular',
  body: {
    400: 'Inter_400Regular',
    500: 'Inter_500Medium',
    600: 'Inter_600SemiBold',
    700: 'Inter_700Bold',
  },
} as const satisfies {
  display: keyof typeof fontAssets;
  body: Record<BodyWeight, keyof typeof fontAssets>;
};

export const bodyFont = (weight: BodyWeight = 400) => fonts.body[weight];
