/**
 * Helpers shared by the scan flow (Scan → Analyzing → Confirm): photo warnings as UI copy,
 * thumbs for PhotoThumbStrip / PhotoStack, and the detect request's locale.
 */
import type { ThumbPhoto } from '@/components/PhotoThumbStrip';
import type { Photo, PhotoWarning } from '@/domain/types';

/** Toast when a photo doesn't fit (camera, picker or demo photos). */
export const MAX_PHOTOS_TOAST = 'Max 6 photos per scan';

/** Photos as thumbs; a photo with a warning (and not retaken) gets the red "blurry" ring. */
export const thumbPhotos = (photos: Photo[], warnings: PhotoWarning[]): ThumbPhoto[] =>
  photos.map((p, i) => ({
    id: p.id,
    uri: p.uri,
    label: p.label ?? `Photo ${i + 1}`,
    blurry: !p.retaken && warnings.some((w) => w.photoIndex === i),
  }));

/** The first warning that still applies, with its photo (for the "Retake" banner). */
export function activeWarning(
  photos: Photo[],
  warnings: PhotoWarning[],
): { warning: PhotoWarning; photo: Photo } | null {
  for (const warning of warnings) {
    const photo = photos[warning.photoIndex];
    if (photo && !photo.retaken) return { warning, photo };
  }
  return null;
}

/** The banner's second line, by warning type. The title is the backend's own message. */
export const warningBody = (w: PhotoWarning): string =>
  w.type === 'no_food' ? "Couldn't spot any food in this one." : 'Quantities may be off.';

/** "Added 3 photos", "Added 2 photos · max 6 per scan", or the cap toast when none fit. */
export function addedToast(added: number, dropped: number): string {
  if (added === 0) return MAX_PHOTOS_TOAST;
  const label = `Added ${added} photo${added === 1 ? '' : 's'}`;
  return dropped > 0 ? `${label} · max 6 per scan` : label;
}

/** The device locale for the detect request (e.g. "en-IN"). */
export function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-IN';
  } catch {
    return 'en-IN';
  }
}
