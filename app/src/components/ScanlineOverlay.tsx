import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';

/**
 * Fine scanline texture, always on. Ported from the prototype's
 * `repeating-linear-gradient` overlay (docs/brief.md §6): 1px dark line every
 * 3px. Static and cheap — drawn once per dimension change, not animated.
 */
export function ScanlineOverlay(): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  const lineYs = useMemo(() => {
    const ys: number[] = [];
    for (let y = 0; y < height; y += 3) ys.push(y);
    return ys;
  }, [height]);

  return (
    <Canvas style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      {lineYs.map((y) => (
        <Rect key={y} x={0} y={y} width={width} height={1} color="rgba(0,0,0,0.13)" />
      ))}
    </Canvas>
  );
}
