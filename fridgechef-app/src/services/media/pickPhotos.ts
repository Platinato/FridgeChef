/** The system photo picker (multi-select), for Scan's gallery button, "+" tile and Retake. */
import * as ImagePicker from 'expo-image-picker';

/** A picked photo, ready for `scanStore.addPhotos`. */
export type PickedPhoto = { uri: string; label: string; width: number; height: number };

/**
 * Opens the picker for up to `limit` images. Resolves `[]` when cancelled or when `limit` is 0.
 * On iOS 14+ this is the system picker (PHPicker), which needs no photo-library permission;
 * `selectionLimit` caps the selection there. Callers still cap the result (web ignores the limit).
 */
export async function pickPhotos(limit: number): Promise<PickedPhoto[]> {
  if (limit <= 0) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: limit > 1,
    selectionLimit: limit,
    orderedSelection: true,
    quality: 1,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({
    uri: a.uri,
    label: 'Gallery',
    width: a.width,
    height: a.height,
  }));
}
