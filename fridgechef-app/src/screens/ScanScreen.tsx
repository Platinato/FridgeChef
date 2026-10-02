import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { Badge } from '@/components/Badge';
import { Chip } from '@/components/Chip';
import { IconButton } from '@/components/IconButton';
import { InfoCard } from '@/components/InfoCard';
import { LiveBadge } from '@/components/LiveBadge';
import { PhotoThumbStrip } from '@/components/PhotoThumbStrip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScanOverlay } from '@/components/ScanOverlay';
import { Screen } from '@/components/Screen';
import { ShutterButton } from '@/components/ShutterButton';
import { showToast } from '@/components/Toast';
import { TopBar } from '@/components/TopBar';
import { plural } from '@/domain/format';
import { MAX_PHOTOS } from '@/domain/scan';
import { pickPhotos } from '@/services/media';
import { useDemoPhotos } from '@/services/queries';
import { useScanStore } from '@/state';
import {
  MAX_PHOTOS_TOAST,
  activeWarning,
  addedToast,
  thumbPhotos,
  warningBody,
} from '@/screens/scanShared';
import { colors, spacing } from '@/theme/tokens';

const FLASH_MS = 420;

/** Scan (mockup screen 3): camera, up to 6 photos from the shutter or the gallery, "Analyze N photos". */
export function ScanScreen() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const photos = useScanStore((s) => s.photos);
  const warnings = useScanStore((s) => s.warnings);
  const addPhotos = useScanStore((s) => s.addPhotos);
  const removePhoto = useScanStore((s) => s.removePhoto);
  const markRetaken = useScanStore((s) => s.markRetaken);
  const demo = useDemoPhotos();

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const camera = useRef<CameraView>(null);
  const busy = useRef(false);

  // Ask once, on the first visit; after that the denied card offers Settings + the gallery.
  const status = permission?.status;
  const canAsk = permission?.canAskAgain ?? false;
  useEffect(() => {
    if (status === 'undetermined' && canAsk) void requestPermission();
  }, [status, canAsk, requestPermission]);

  const granted = permission?.granted ?? false;
  const cameraOn = granted && !unavailable;
  const full = photos.length >= MAX_PHOTOS;
  const flash = useCaptureFlash();

  /** A still from the live camera, or null (not ready, or the capture failed). */
  const capture = async (): Promise<string | null> => {
    if (!camera.current || !ready || busy.current) return null;
    busy.current = true;
    try {
      flash.fire();
      const shot = await camera.current.takePictureAsync({ quality: 0.9 });
      return shot?.uri ?? null;
    } catch (error) {
      console.warn('[scan] capture failed', error);
      showToast("Couldn't take that photo");
      return null;
    } finally {
      busy.current = false;
    }
  };

  const shutter = async () => {
    if (full) return showToast(MAX_PHOTOS_TOAST);
    const uri = await capture();
    if (uri) await addPhotos([{ uri, label: 'Camera' }]);
  };

  const openPicker = async () => {
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return showToast(MAX_PHOTOS_TOAST);
    const picked = await pickPhotos(room);
    if (picked.length === 0) return;
    const { added, dropped } = await addPhotos(picked.map(({ uri, label }) => ({ uri, label })));
    showToast(addedToast(added, dropped));
  };

  const addDemoPhotos = async () => {
    const list = demo.data ?? [];
    const { added, dropped } = await addPhotos(list.map(({ uri, label }) => ({ uri, label })));
    showToast(addedToast(added, dropped));
  };

  /** Retake: a fresh shot from the camera, or a gallery pick when the camera is off. */
  const retake = async (photoId: string) => {
    const uri = cameraOn ? await capture() : ((await pickPhotos(1))[0]?.uri ?? null);
    if (!uri) return;
    await markRetaken(photoId, uri);
    showToast('Retaken - nice and sharp');
  };

  const warn = activeWarning(photos, warnings);
  const last = photos[photos.length - 1];
  const showDemo = demo.enabled && (demo.data?.length ?? 0) > 0 && !full;

  return (
    <Screen
      flush
      scroll={false}
      footerVariant="clear"
      testID="scan-screen"
      overlay={<Animated.View style={[styles.flash, flash.style]} />}
      footer={
        <>
          <PrimaryButton
            label={photos.length ? `Analyze ${plural(photos.length, 'photo')}` : 'Analyze photos'}
            variant="lime"
            disabled={photos.length === 0}
            onPress={() => router.push('/scan/analyzing')}
          />
          {photos.length === 0 ? (
            <AppText variant="caption" align="center">
              Take or upload at least one photo to continue.
            </AppText>
          ) : null}
        </>
      }
    >
      {/* Viewfinder: full bleed behind everything (absolute children ignore the body padding). */}
      <View style={styles.viewfinder}>
        {cameraOn ? (
          <CameraView
            ref={camera}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flashOn ? 'on' : 'off'}
            active={focused}
            animateShutter={false}
            onCameraReady={() => setReady(true)}
            onMountError={(e) => {
              console.warn('[scan] camera unavailable', e.message);
              setUnavailable(true);
            }}
            testID="camera"
          />
        ) : null}
        <ScanOverlay />
        <LinearGradient
          colors={[colors.bgClear, colors.scanPanelMid, colors.bg]}
          locations={[0, 0.28, 1]}
          style={styles.panelFade}
        />
      </View>

      <TopBar
        overlay
        left={
          <IconButton
            icon="back"
            label="Back"
            variant="glass"
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          />
        }
        center={<LiveBadge label="Ready" />}
        right={
          <IconButton
            icon="flash"
            label={flashOn ? 'Flash on' : 'Flash off'}
            variant={flashOn ? 'lime' : 'glass'}
            onPress={() => setFlashOn((on) => !on)}
          />
        }
      />
      <View style={[styles.tip, { top: insets.top + 66 }]}>
        {/* Badge aligns itself to flex-start; the wrapper is what gets centred. */}
        <View>
          <Badge
            label="Open the door wide · Good light · Multiple angles"
            variant="glass"
            size="sm"
          />
        </View>
      </View>

      {permission && !cameraOn ? (
        <View style={[styles.blocked, { top: insets.top + 110 }]}>
          <CameraBlocked
            unavailable={unavailable}
            canAsk={canAsk}
            onAllow={() => void requestPermission()}
            onGallery={() => void openPicker()}
          />
        </View>
      ) : null}

      <View style={styles.spacer} />
      <View style={styles.panel}>
        {warn ? (
          <InfoCard
            icon="alert"
            variant="alert"
            title={warn.warning.message}
            body={warningBody(warn.warning)}
            right={
              <PrimaryButton
                label="Retake"
                variant="light"
                size="xs"
                full={false}
                onPress={() => void retake(warn.photo.id)}
              />
            }
          />
        ) : null}
        {showDemo ? (
          <View style={styles.demo}>
            <Chip label="Use demo photos" icon="gallery" size="sm" onPress={addDemoPhotos} />
          </View>
        ) : null}
        <PhotoThumbStrip
          photos={thumbPhotos(photos, warnings)}
          onRemove={(id) => void removePhoto(id)}
          onAdd={() => void openPicker()}
          max={MAX_PHOTOS}
        />
        <View style={styles.controls}>
          {last ? (
            <IconButton
              image={last.uri}
              label="Upload from gallery"
              size={52}
              onPress={() => void openPicker()}
            />
          ) : (
            <IconButton
              icon="gallery"
              label="Upload from gallery"
              variant="glass"
              size={52}
              onPress={() => void openPicker()}
            />
          )}
          <ShutterButton disabled={full || !cameraOn || !ready} onPress={() => void shutter()} />
          <IconButton
            icon="flip"
            label="Switch camera"
            variant="glass"
            size={52}
            disabled={!cameraOn}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          />
        </View>
      </View>
    </Screen>
  );
}

/** No camera: ask (first time), send to Settings (denied), or say it's unavailable; always offer the gallery. */
function CameraBlocked({
  unavailable,
  canAsk,
  onAllow,
  onGallery,
}: {
  unavailable: boolean;
  canAsk: boolean;
  onAllow: () => void;
  onGallery: () => void;
}) {
  const copy = unavailable
    ? {
        title: 'Camera unavailable',
        body: 'Pick photos of your fridge and pantry from your gallery.',
      }
    : canAsk
      ? {
          title: 'Camera access',
          body: 'Allow the camera to photograph your fridge and pantry, or pick photos from your gallery.',
        }
      : {
          title: 'Camera is off',
          body: 'Turn on camera access for FridgeChef in Settings, or pick photos from your gallery.',
        };
  return (
    <InfoCard
      icon="camera"
      variant="glass"
      title={copy.title}
      body={copy.body}
      footer={
        <View style={styles.blockedActions}>
          {unavailable ? null : canAsk ? (
            <PrimaryButton
              label="Allow camera"
              variant="lime"
              size="sm"
              full={false}
              onPress={onAllow}
            />
          ) : (
            <PrimaryButton
              label="Open Settings"
              variant="lime"
              size="sm"
              full={false}
              onPress={() => void Linking.openSettings()}
            />
          )}
          <PrimaryButton
            label="Choose from gallery"
            variant="outline"
            size="sm"
            full={false}
            onPress={onGallery}
          />
        </View>
      }
    />
  );
}

/** The white capture flash (0.95 → 0 over 420 ms, like `.s-scan__flash`). Off with Reduce Motion. */
function useCaptureFlash() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ opacity: opacity.get() }));
  return {
    style,
    fire: () => {
      if (reduceMotion) return;
      opacity.set(0.95);
      opacity.set(withTiming(0, { duration: FLASH_MS, easing: Easing.out(Easing.quad) }));
    },
  };
}

const styles = StyleSheet.create({
  viewfinder: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.viewfinderBg,
  },
  panelFade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '48%' },
  flash: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 40,
    backgroundColor: colors.white,
    pointerEvents: 'none',
  },
  tip: { position: 'absolute', left: 0, right: 0, zIndex: 5, alignItems: 'center' },
  blocked: { position: 'absolute', left: spacing.gutter, right: spacing.gutter, zIndex: 6 },
  blockedActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  spacer: { flex: 1 },
  panel: { gap: spacing[3], zIndex: 6 },
  demo: { flexDirection: 'row' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
});
