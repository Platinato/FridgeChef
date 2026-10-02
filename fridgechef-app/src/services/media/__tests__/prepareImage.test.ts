import { ImageManipulator } from 'expo-image-manipulator';

import {
  JPEG_QUALITY,
  MAX_EDGE,
  fittedSize,
  isAbortError,
  prepareImage,
  prepareImages,
  resizeTarget,
  stripDataPrefix,
} from '../prepareImage';

/** A fake manipulator context: records resizes and renders at the resulting size. */
function fakeContext(original: { width: number; height: number }) {
  let size = { ...original };
  const ctx = {
    resize: jest.fn((target: { width?: number; height?: number }): unknown => {
      size = fittedSize(original, target.width ?? target.height);
      return ctx;
    }),
    renderAsync: jest.fn(async () => ({
      ...size,
      saveAsync: jest.fn(async (opts: unknown) => ({
        uri: 'file:///cache/out.jpg',
        ...size,
        base64: 'data:image/jpeg;base64,QUJD',
        opts,
      })),
    })),
    release: jest.fn(),
  };
  return ctx;
}

jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

const manipulate = jest.mocked(ImageManipulator.manipulate);
const useContext = (original: { width: number; height: number }) => {
  const ctx = fakeContext(original);
  manipulate.mockReturnValue(ctx as unknown as ReturnType<typeof ImageManipulator.manipulate>);
  return ctx;
};

describe('resizeTarget / fittedSize (≤ 1280 px on the long edge)', () => {
  it.each([
    // [original, target, fitted]
    [{ width: 4032, height: 3024 }, { width: 1280 }, { width: 1280, height: 960 }],
    [{ width: 3024, height: 4032 }, { height: 1280 }, { width: 960, height: 1280 }],
    [{ width: 2000, height: 2000 }, { width: 1280 }, { width: 1280, height: 1280 }],
    [{ width: 1281, height: 721 }, { width: 1280 }, { width: 1280, height: 720 }],
  ])('%j → %j (%j)', (original, target, fitted) => {
    expect(resizeTarget(original)).toEqual(target);
    expect(fittedSize(original)).toEqual(fitted);
  });

  it('never upscales: images that already fit are left alone', () => {
    expect(resizeTarget({ width: 1280, height: 720 })).toBeNull();
    expect(resizeTarget({ width: 800, height: 600 })).toBeNull();
    expect(fittedSize({ width: 800, height: 600 })).toEqual({ width: 800, height: 600 });
  });

  it('treats an unknown (0) size as "leave alone"', () => {
    expect(resizeTarget({ width: 0, height: 0 })).toBeNull();
    expect(resizeTarget({ width: NaN, height: 100 })).toBeNull();
  });

  it('honours a custom edge', () => {
    expect(resizeTarget({ width: 1000, height: 500 }, 640)).toEqual({ width: 640 });
    expect(fittedSize({ width: 1000, height: 500 }, 640)).toEqual({ width: 640, height: 320 });
  });

  it('strips a data: prefix but leaves raw base64 alone', () => {
    expect(stripDataPrefix('data:image/jpeg;base64,QUJD')).toBe('QUJD');
    expect(stripDataPrefix('QUJD')).toBe('QUJD');
  });
});

describe('prepareImage', () => {
  beforeEach(() => manipulate.mockReset());

  it('resizes a big photo, saves JPEG 0.7 with base64, and releases the context', async () => {
    const ctx = useContext({ width: 4032, height: 3024 });
    const out = await prepareImage({ id: 'ph1', uri: 'file:///photo.jpg' });

    expect(manipulate).toHaveBeenCalledWith('file:///photo.jpg');
    expect(ctx.resize).toHaveBeenCalledWith({ width: MAX_EDGE });
    const image = await ctx.renderAsync.mock.results.at(-1)!.value;
    expect(image.saveAsync).toHaveBeenCalledWith({
      base64: true,
      compress: JPEG_QUALITY,
      format: 'jpeg',
    });
    expect(out).toEqual({
      id: 'ph1',
      mimeType: 'image/jpeg',
      base64: 'QUJD',
      width: 1280,
      height: 960,
    });
    expect(ctx.release).toHaveBeenCalled();
  });

  it('skips the resize for a small photo, and the extra decode when the size is known', async () => {
    const ctx = useContext({ width: 900, height: 1200 });
    const out = await prepareImage(
      { id: 'ph2', uri: 'file:///small.jpg' },
      { width: 900, height: 1200 },
    );
    expect(ctx.resize).not.toHaveBeenCalled();
    expect(ctx.renderAsync).toHaveBeenCalledTimes(1);
    expect(out).toMatchObject({ width: 900, height: 1200 });
  });

  it('renders once for a photo that already fits, and twice for one that needs a resize', async () => {
    const small = useContext({ width: 800, height: 600 });
    await prepareImage({ id: 's', uri: 'https://example.com/demo.jpg' });
    expect(small.renderAsync).toHaveBeenCalledTimes(1);
    expect(small.resize).not.toHaveBeenCalled();

    const big = useContext({ width: 4032, height: 3024 });
    await prepareImage({ id: 'b', uri: 'file:///big.jpg' });
    expect(big.renderAsync).toHaveBeenCalledTimes(2);
  });

  it('releases the context when saving fails', async () => {
    const ctx = useContext({ width: 100, height: 100 });
    ctx.renderAsync.mockRejectedValueOnce(new Error('decode failed'));
    await expect(prepareImage({ id: 'x', uri: 'file:///bad.jpg' })).rejects.toThrow(
      'decode failed',
    );
    expect(ctx.release).toHaveBeenCalled();
  });

  it('prepareImages keeps order and stops on abort', async () => {
    useContext({ width: 2560, height: 1440 });
    const out = await prepareImages([
      { id: 'a', uri: 'file:///a.jpg' },
      { id: 'b', uri: 'file:///b.jpg' },
    ]);
    expect(out.map((p) => [p.id, p.width, p.height])).toEqual([
      ['a', 1280, 720],
      ['b', 1280, 720],
    ]);

    const controller = new AbortController();
    controller.abort();
    const error = await prepareImages([{ id: 'c', uri: 'file:///c.jpg' }], controller.signal).catch(
      (e: unknown) => e,
    );
    expect(isAbortError(error)).toBe(true);
  });
});
