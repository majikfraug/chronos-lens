import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';

/**
 * Dithers a captured camera still to the Lens look: downsample to 128×96,
 * luminance, Bayer 4×4, 4-tone phosphor palette. Ported from the prototype's
 * renderFeed() (brief §3 camera pipeline, §6 camera dither rules).
 *
 * Runs at capture time, not per-frame: Expo Go has no camera frame processors,
 * so live 30fps dithering waits for a dev-client build — see docs/decisions.md.
 */
export const FEED_W = 128;
export const FEED_H = 96;
/** Integer upscale so the result stays crisp without nearest-neighbor sampling support. */
const UPSCALE = 4;

const PAL: [number, number, number][] = [
  [9, 12, 9],
  [38, 50, 32],
  [92, 113, 78],
  [157, 184, 154],
];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/**
 * When the on-screen view (cover-filled camera) and the centered capture
 * window are given, the photo is cropped to exactly the region the window
 * framed; otherwise falls back to a plain center-crop.
 */
export type CaptureWindow = {
  viewW: number;
  viewH: number;
  windowW: number;
  windowH: number;
};

export function ditherCapturedStill(base64Jpeg: string, window?: CaptureWindow): SkImage {
  const data = Skia.Data.fromBase64(base64Jpeg);
  const source = Skia.Image.MakeImageFromEncoded(data);
  if (!source) throw new Error('Failed to decode captured still');

  // Downsample through an offscreen surface (cover-crop to 4:3).
  const surface = Skia.Surface.Make(FEED_W, FEED_H);
  if (!surface) throw new Error('Failed to allocate dither surface');
  const canvas = surface.getCanvas();
  const srcW = source.width();
  const srcH = source.height();
  const targetAspect = FEED_W / FEED_H;
  let cropW = srcW;
  let cropH = srcW / targetAspect;
  if (cropH > srcH) {
    cropH = srcH;
    cropW = srcH * targetAspect;
  }
  if (window) {
    // The view shows the photo cover-fitted: scale = max ratio, centered.
    // The capture window is centered in the view, so its photo-space crop is
    // simply the window size divided by that scale, centered in the photo.
    const scale = Math.max(window.viewW / srcW, window.viewH / srcH);
    cropW = Math.min(srcW, window.windowW / scale);
    cropH = Math.min(srcH, window.windowH / scale);
  }
  const cropX = (srcW - cropW) / 2;
  const cropY = (srcH - cropH) / 2;
  canvas.drawImageRect(
    source,
    Skia.XYWHRect(cropX, cropY, cropW, cropH),
    Skia.XYWHRect(0, 0, FEED_W, FEED_H),
    Skia.Paint()
  );
  const small = surface.makeImageSnapshot();
  const pixels = small.readPixels(0, 0, {
    width: FEED_W,
    height: FEED_H,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  }) as Uint8Array | null;
  if (!pixels) throw new Error('Failed to read downsampled pixels');

  // Bayer-dither to the 4-tone phosphor palette, upscaled by integer factor.
  const outW = FEED_W * UPSCALE;
  const outH = FEED_H * UPSCALE;
  const out = new Uint8Array(outW * outH * 4);
  for (let y = 0; y < FEED_H; y++) {
    for (let x = 0; x < FEED_W; x++) {
      const i = (y * FEED_W + x) * 4;
      const lum = (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114) / 255;
      const bv = BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5;
      let idx = Math.round(lum * (PAL.length - 1) + bv * 0.9);
      idx = idx < 0 ? 0 : idx > PAL.length - 1 ? PAL.length - 1 : idx;
      const c = PAL[idx];
      for (let dy = 0; dy < UPSCALE; dy++) {
        const rowStart = ((y * UPSCALE + dy) * outW + x * UPSCALE) * 4;
        for (let dx = 0; dx < UPSCALE; dx++) {
          const o = rowStart + dx * 4;
          out[o] = c[0];
          out[o + 1] = c[1];
          out[o + 2] = c[2];
          out[o + 3] = 255;
        }
      }
    }
  }

  const image = Skia.Image.MakeImage(
    { width: outW, height: outH, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Opaque },
    Skia.Data.fromBytes(out),
    outW * 4
  );
  if (!image) throw new Error('Failed to build dithered still');
  return image;
}
