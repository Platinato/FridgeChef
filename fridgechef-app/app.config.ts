import type { ExpoConfig } from 'expo/config';

// Keep in sync with src/theme/tokens.ts (Sprint 02) - mockup --bg.
const BACKGROUND = '#0A0A0A';

const config: ExpoConfig = {
  name: 'FridgeChef',
  slug: 'fridgechef',
  version: '1.0.0',
  scheme: 'fridgechef',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  backgroundColor: BACKGROUND,
  icon: './assets/images/icon.png',
  ios: {
    // Placeholder: replace with the real bundle id before the first EAS build.
    bundleIdentifier: 'com.fridgechef.app',
    supportsTablet: false,
    icon: './assets/expo.icon',
  },
  android: {
    adaptiveIcon: {
      backgroundColor: BACKGROUND,
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: BACKGROUND,
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
