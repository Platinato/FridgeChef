/**
 * Photo → upload-ready image (api-contract.md, `POST /v1/scans/detect`): at most 1280 px on the
 * long edge, JPEG 0.7, base64 without a `data:` prefix. Never upscales.
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { PreparedImage } from '@/services/api';

export const MAX_EDGE = 1280;
export const JPEG_QUALITY = 0.7;

export type Size = { width: number; height: number };

/** A photo ready to send, plus its final size. */
export type PreparedPhoto = PreparedImage & Size;

/**
 * The resize target for an image of `size`: `null` when it already fits (or the size is
 * unknown), otherwise the long edge set to `maxEdge` and the short edge scaled to match.
 * Only one side is set, so the manipulator keeps the exact aspect ratio.
 */
export function resizeTarget(
  size: Size,
  maxEdge: number = MAX_EDGE,
): { width: number } | { height: number } | null {
  const { width, height } = size;
  if (!(width > 0) || !(height > 0)) return null;
  if (Math.max(width, height) <= maxEdge) return null;
  return width >= height ? { width: maxEdge } : { height: maxEdge };
}

/** The size after `resizeTarget` (rounded like the manipulator). */
export function fittedSize(size: Size, maxEdge: number = MAX_EDGE): Size {
  const target = resizeTarget(size, maxEdge);
  if (!target) return size;
  if ('width' in target) {
    return { width: target.width, height: Math.round((size.height * target.width) / size.width) };
  }
  return { width: Math.round((size.width * target.height) / size.height), height: target.height };
}

/** Strips a `data:<mime>;base64,` prefix, if the platform added one (web). */
export const stripDataPrefix = (data: string): string => data.replace(/^data:[^,]*,/, '');

/**
 * Resizes and compresses one photo (`uri`: a local file, a picker asset or a remote demo image).
 * `size` skips a decode when the caller already knows the dimensions (camera / picker result).
 */
export async function prepareImage(
  photo: { id: string; uri: string },
  size?: Size,
): Promise<PreparedPhoto> {
  const context = ImageManipulator.manipulate(photo.uri);
  try {
    const known = size && size.width > 0 && size.height > 0 ? size : null;
    // Every render costs an encode (a full PNG on web), so render at most twice and reuse the
    // first render when it already fits.
    const first = known ? null : await context.renderAsync();
    const target = resizeTarget(known ?? first!);
    if (target) context.resize(target);
    const image = target || !first ? await context.renderAsync() : first;
    const saved = await image.saveAsync({
      base64: true,
      compress: JPEG_QUALITY,
      format: SaveFormat.JPEG,
    });
    if (!saved.base64) throw new Error(`prepareImage: no image data for ${photo.id}`);
    return {
      id: photo.id,
      mimeType: 'image/jpeg',
      base64: stripDataPrefix(saved.base64),
      width: saved.width,
      height: saved.height,
    };
  } finally {
    context.release();
  }
}

/** What a cancelled prepare rejects with (`isAbortError`). */
const abortError = (): Error => Object.assign(new Error('Aborted'), { name: 'AbortError' });

export const isAbortError = (e: unknown): boolean => e instanceof Error && e.name === 'AbortError';

/** Prepares every photo in order (one at a time, to keep memory flat on older iPhones). */
export async function prepareImages(
  photos: { id: string; uri: string }[],
  signal?: AbortSignal,
): Promise<PreparedPhoto[]> {
  const out: PreparedPhoto[] = [];
  for (const photo of photos) {
    if (signal?.aborted) throw abortError();
    out.push(await prepareImage(photo));
  }
  return out;
}
