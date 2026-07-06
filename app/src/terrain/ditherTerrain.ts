import { AlphaType, ColorType, Skia, type SkImage } from '@shopify/react-native-skia';
import type { Heightfield } from './heightfieldBuilder';

/**
 * Ported from prototypes/chronos-lens-v1.html `bakeTerrain()` — 6-band
 * ordered-Bayer dither + single-pixel contour isolines at band boundaries.
 * Brief §6.
 */
const LEVELS = 6;
const SHADES: [number, number, number][] = [
  [14, 18, 12],
  [26, 34, 22],
  [40, 52, 34],
  [56, 72, 47],
  [78, 98, 64],
  [110, 138, 92],
];
const CONTOUR_SHADE: [number, number, number] = [150, 178, 140];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export function renderDitheredTerrain(field: Heightfield): SkImage {
  const { size, heights } = field;

  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < heights.length; i++) {
    const h = heights[i];
    if (h < min) min = h;
    if (h > max) max = h;
  }
  const range = max - min || 1;

  const normalized = new Float32Array(heights.length);
  const band = new Uint8Array(heights.length);
  for (let i = 0; i < heights.length; i++) {
    const n = (heights[i] - min) / range;
    normalized[i] = n;
    band[i] = Math.min(LEVELS - 1, Math.floor(n * LEVELS));
  }

  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const o = i * 4;
      const bv = BAYER[(y % 4) * 4 + (x % 4)] / 16 - 0.5;
      let idx = Math.round(normalized[i] * (LEVELS - 1) + bv * 0.85);
      idx = idx < 0 ? 0 : idx > LEVELS - 1 ? LEVELS - 1 : idx;
      let shade = SHADES[idx];

      const here = band[i];
      const right = x < size - 1 ? band[i + 1] : here;
      const down = y < size - 1 ? band[i + size] : here;
      if (here !== right || here !== down) shade = CONTOUR_SHADE;

      pixels[o] = shade[0];
      pixels[o + 1] = shade[1];
      pixels[o + 2] = shade[2];
      pixels[o + 3] = 255;
    }
  }

  const data = Skia.Data.fromBytes(pixels);
  const image = Skia.Image.MakeImage(
    { width: size, height: size, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Opaque },
    data,
    size * 4
  );
  if (!image) throw new Error('Failed to build dithered terrain image');
  return image;
}
