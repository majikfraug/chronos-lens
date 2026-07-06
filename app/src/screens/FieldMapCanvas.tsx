import {
  Canvas,
  Circle,
  Group,
  Image as SkiaImage,
  Line,
  RadialGradient,
  Rect,
  vec,
  type SkImage,
} from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { FIELD } from '../config/economy';
import type { LocalMeters } from '../location/projection';
import type { Heightfield } from '../terrain/heightfieldBuilder';
import { colors } from '../theme/colors';

type Props = {
  width: number;
  height: number;
  terrainImage: SkImage | null;
  heightfield: Heightfield | null;
  playerMeters: LocalMeters;
  revealedCells: Set<string>;
  viewMetres: number;
};

/**
 * Composites the dithered terrain texture, cropped/scaled to the current
 * view window, with an accumulated fog-of-war reveal mask (dstIn blend —
 * ported from the prototype's destination-in canvas compositing, brief §6).
 */
export function FieldMapCanvas({
  width,
  height,
  terrainImage,
  heightfield,
  playerMeters,
  revealedCells,
  viewMetres,
}: Props): React.JSX.Element {
  const pxPerMeter = width / viewMetres;
  const viewHeightMetres = height / pxPerMeter;
  const leftWorldX = playerMeters.x - viewMetres / 2;
  const topWorldY = playerMeters.y + viewHeightMetres / 2;

  const worldToCanvas = (wx: number, wy: number): { x: number; y: number } => ({
    x: (wx - leftWorldX) * pxPerMeter,
    y: (topWorldY - wy) * pxPerMeter,
  });

  const revealRadiusPx = FIELD.revealRadiusM * pxPerMeter;

  const visibleReveals = useMemo(() => {
    const margin = FIELD.revealRadiusM;
    const points: { x: number; y: number }[] = [];
    for (const key of revealedCells) {
      const [cxStr, cyStr] = key.split(',');
      const centerX = (Number(cxStr) + 0.5) * FIELD.revealSnapM;
      const centerY = (Number(cyStr) + 0.5) * FIELD.revealSnapM;
      if (
        centerX < leftWorldX - margin ||
        centerX > leftWorldX + viewMetres + margin ||
        centerY > topWorldY + margin ||
        centerY < topWorldY - viewHeightMetres - margin
      ) {
        continue;
      }
      points.push(worldToCanvas(centerX, centerY));
    }
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealedCells, leftWorldX, topWorldY, viewMetres, viewHeightMetres, pxPerMeter]);

  const terrainTransform = useMemo(() => {
    if (!heightfield) return undefined;
    const scale = pxPerMeter * heightfield.metersPerPixel;
    const texelXAtLeft = (leftWorldX - heightfield.originMeters.x) / heightfield.metersPerPixel;
    const texelYAtTop = (heightfield.originMeters.y - topWorldY) / heightfield.metersPerPixel;
    return [{ translateX: -texelXAtLeft * scale }, { translateY: -texelYAtTop * scale }, { scale }];
  }, [heightfield, pxPerMeter, leftWorldX, topWorldY]);

  const player = worldToCanvas(playerMeters.x, playerMeters.y);

  return (
    <Canvas style={{ width, height }}>
      <Rect x={0} y={0} width={width} height={height} color="#070907" />

      {terrainImage && heightfield && terrainTransform && (
        <Group layer clip={{ x: 0, y: 0, width, height }}>
          <Group transform={terrainTransform}>
            <SkiaImage
              image={terrainImage}
              x={0}
              y={0}
              width={heightfield.size}
              height={heightfield.size}
              fit="fill"
            />
          </Group>
          <Group blendMode="dstIn">
            {visibleReveals.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={revealRadiusPx}>
                <RadialGradient
                  c={vec(p.x, p.y)}
                  r={revealRadiusPx}
                  colors={['white', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
                  positions={[0, 0.7, 1]}
                />
              </Circle>
            ))}
          </Group>
        </Group>
      )}

      {/* player marker: ring + neon crosshair ticks, per prototype drawMap() */}
      <Circle cx={player.x} cy={player.y} r={5} style="stroke" strokeWidth={1} color={colors.bright} />
      <Line p1={vec(player.x, player.y - 7)} p2={vec(player.x, player.y - 3)} color={colors.neon} strokeWidth={1} />
      <Line p1={vec(player.x, player.y + 3)} p2={vec(player.x, player.y + 7)} color={colors.neon} strokeWidth={1} />
      <Line p1={vec(player.x - 7, player.y)} p2={vec(player.x - 3, player.y)} color={colors.neon} strokeWidth={1} />
      <Line p1={vec(player.x + 3, player.y)} p2={vec(player.x + 7, player.y)} color={colors.neon} strokeWidth={1} />
    </Canvas>
  );
}
