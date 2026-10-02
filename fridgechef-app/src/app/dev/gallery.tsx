import { Redirect } from 'expo-router';

import { ComponentGalleryScreen } from '@/screens/dev/ComponentGalleryScreen';

/** Dev-only component gallery. Release builds redirect home. */
export default function GalleryRoute() {
  if (!__DEV__) return <Redirect href="/" />;
  return <ComponentGalleryScreen />;
}
