import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useFonts } from 'expo-font';
import { DarkTheme, Stack, ThemeProvider, type ErrorBoundaryProps, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useReducedMotion } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ToastHost } from '@/components/Toast';
import { AppEffects } from '@/screens/shell/AppEffects';
import { AppErrorScreen } from '@/screens/shell/AppErrorScreen';
import { BootErrorScreen } from '@/screens/shell/BootErrorScreen';
import { useBoot } from '@/screens/shell/useBoot';
import { connectOnlineManager } from '@/services/network';
import { QueryProvider } from '@/services/queries';
import { fontAssets } from '@/theme/fonts';
import { colors } from '@/theme/tokens';

// Keep the native splash up until fonts + database + stores are ready (module scope, per the SDK 57 docs).
SplashScreen.preventAutoHideAsync();
// http mode: queries pause offline and refetch on reconnect (mock mode never pauses).
connectOnlineManager();

/** Dark everywhere, so no white frame flashes between screens. */
const navTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.lime,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    border: colors.bg,
  },
};

/** Stack transitions: a short slide (iOS honours the duration), matching the mockup's 150-250 ms. */
const TRANSITION_MS = 240;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const boot = useBoot();
  const reduceMotion = useReducedMotion();
  const fontsDone = fontsLoaded || !!fontError;
  // The splash goes once there is something to show: the app, or the boot error screen.
  const settled = fontsDone && (boot.status !== 'booting' || boot.failedOnce);

  useEffect(() => {
    if (settled) SplashScreen.hideAsync();
  }, [settled]);

  // On a font error we still render: text falls back to the system font rather than a blank app.
  if (!settled) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider value={navTheme}>
          <QueryProvider>
            <BottomSheetModalProvider>
              <StatusBar style="light" />
              {boot.status === 'ready' ? (
                <>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: colors.bg },
                      // Reduce Motion: a fade instead of the sideways slide.
                      animation: reduceMotion ? 'fade' : 'slide_from_right',
                      animationDuration: TRANSITION_MS,
                    }}
                  >
                    <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                    <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                  </Stack>
                  {/* After the Stack, so the offline banner paints above the screens. */}
                  <AppEffects />
                </>
              ) : (
                <BootErrorScreen
                  retrying={boot.status === 'booting'}
                  onRetry={boot.retry}
                  kind={boot.errorKind}
                />
              )}
            </BottomSheetModalProvider>
            <ToastHost />
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
});

/** App-level error boundary (Expo Router picks it up from the root layout): a friendly fallback + "Restart". */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <AppErrorScreen error={error} onRestart={() => void retry()} />;
}
