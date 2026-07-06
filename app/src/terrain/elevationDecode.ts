import { AlphaType, ColorType, Skia } from '@shopify/react-native-skia';

export const TILE_PX = 256;

/**
 * Decodes a Terrarium-encoded elevation PNG into meters-above-sea-level per
 * pixel. Encoding: height = (R * 256 + G + B / 256) - 32768.
 * https://www.mapzen.com/blog/terrain-tile-service/
 */
export async function decodeElevationTile(localUri: string): Promise<Float32Array> {
  const data = await Skia.Data.fromURI(localUri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error(`Failed to decode elevation tile at ${localUri}`);

  const pixels = image.readPixels(0, 0, {
    width: TILE_PX,
    height: TILE_PX,
    colorType: ColorType.RGBA_8888,
    alphaType: AlphaType.Unpremul,
  }) as Uint8Array | null;
  if (!pixels) throw new Error(`Failed to read pixels for elevation tile at ${localUri}`);

  const heights = new Float32Array(TILE_PX * TILE_PX);
  for (let i = 0; i < heights.length; i++) {
    const o = i * 4;
    const r = pixels[o];
    const g = pixels[o + 1];
    const b = pixels[o + 2];
    heights[i] = r * 256 + g + b / 256 - 32768;
  }
  return heights;
}
