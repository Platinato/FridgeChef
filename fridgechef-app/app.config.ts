import type { ExpoConfig } from 'expo/config';

// Keep in sync with src/theme/tokens.ts (Sprint 02) - mockup --bg.
const BACKGROUND = '#0A0A0A';

// iOS usage strings (Sprint 07 instructions).
const CAMERA_USAGE = 'FridgeChef uses the camera to photograph your fridge and pantry.';
const PHOTOS_USAGE = 'FridgeChef lets you pick photos of your fridge and pantry.';

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
    // The lime logo disc on #0A0A0A (scripts/make-icons.ps1), not the template's Expo .icon bundle.
    icon: './assets/images/icon.png',
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
    output: 'single',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: BACKGROUND,
        image: './assets/images/splash-icon.png',
        // splash-icon.png is the logo disc alone (scripts/make-icons.ps1), centred on #0A0A0A.
        imageWidth: 96,
      },
    ],
    // On-device database (Sprint 04). Defaults: no SQLCipher; encryption can be turned on later.
    'expo-sqlite',
    // Scan (Sprint 07): photos only, so no microphone. Expo Go uses its own usage strings;
    // these reach the Info.plist of a development / EAS build.
    [
      'expo-camera',
      {
        cameraPermission: CAMERA_USAGE,
        microphonePermission: false,
        recordAudioAndroid: false,
        barcodeScannerEnabled: false,
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: PHOTOS_USAGE,
        cameraPermission: CAMERA_USAGE,
        microphonePermission: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
