/** Scan-session rules: the confirm gate, confidence order, the photo cap. */
import type { AddableItem, DetectedItem, Photo, PhotoWarning } from './types';

export const MAX_PHOTOS = 6;

/** Low-confidence items the user hasn't checked yet. Recipes wait until this is empty. */
export const pendingChecks = (items: DetectedItem[]): DetectedItem[] =>
  items.filter((d) => d.confidence === 'low' && !d.touched);

const CONFIDENCE_ORDER: Record<string, number> = { low: 0, med: 1, high: 2 };

/** Confirm-screen order: low → med → high → manual. Stable within a group. */
export const sortByConfidence = (items: DetectedItem[]): DetectedItem[] =>
  items
    .slice()
    .sort((a, b) => (CONFIDENCE_ORDER[a.confidence] ?? 3) - (CONFIDENCE_ORDER[b.confidence] ?? 3));

/** Appends photos up to the cap. `dropped` = how many didn't fit. */
export function capPhotos(
  current: Photo[],
  incoming: Photo[],
): { photos: Photo[]; dropped: number } {
  const room = Math.max(0, MAX_PHOTOS - current.length);
  const added = incoming.slice(0, room);
  return { photos: current.concat(added), dropped: incoming.length - added.length };
}

/**
 * Removes a photo. Warnings are keyed by photo index, so the removed photo's warnings go and
 * later ones shift down to stay attached to the same photo.
 */
export function removePhotoAt(
  photos: Photo[],
  warnings: PhotoWarning[],
  photoId: string,
): { photos: Photo[]; warnings: PhotoWarning[] } {
  const index = photos.findIndex((p) => p.id === photoId);
  if (index < 0) return { photos, warnings };
  return {
    photos: photos.filter((p) => p.id !== photoId),
    warnings: warnings
      .filter((w) => w.photoIndex !== index)
      .map((w) => (w.photoIndex > index ? { ...w, photoIndex: w.photoIndex - 1 } : w)),
  };
}

/** A retaken photo is sharp again: mark it (with the new shot's `uri`, if any) and drop its warnings. */
export function retakePhoto(
  photos: Photo[],
  warnings: PhotoWarning[],
  photoId: string,
  uri?: string,
): { photos: Photo[]; warnings: PhotoWarning[] } {
  const index = photos.findIndex((p) => p.id === photoId);
  if (index < 0) return { photos, warnings };
  return {
    photos: photos.map((p) =>
      p.id === photoId ? { ...p, retaken: true, ...(uri !== undefined && { uri }) } : p,
    ),
    warnings: warnings.filter((w) => w.photoIndex !== index),
  };
}

/** A "missed item" the user adds on Confirm: already confirmed, no estimate. */
export const manualItem = (a: AddableItem): DetectedItem => ({
  id: a.id,
  name: a.name,
  category: 'Added',
  unit: a.unit,
  min: a.min,
  max: a.max,
  step: a.step,
  estimate: null,
  value: a.defaultValue,
  displayUnit: a.unit,
  confidence: 'manual',
  photoIndex: null,
  touched: true,
});
