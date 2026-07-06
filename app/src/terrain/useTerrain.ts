import type { SkImage } from '@shopify/react-native-skia';
import { useEffect, useRef, useState } from 'react';
import type { LatLon } from '../location/projection';
import { renderDitheredTerrain } from './ditherTerrain';
import { buildLocalHeightfield, TILE_ZOOM, type Heightfield } from './heightfieldBuilder';
import { lonLatToTileFractional } from './tileMath';

export type TerrainStatus = 'idle' | 'loading' | 'ready' | 'error';

export type TerrainState = {
  heightfield: Heightfield | null;
  terrainImage: SkImage | null;
  status: TerrainStatus;
};

/**
 * Rebakes the local dithered terrain composite only when the player crosses
 * into a new source tile — not on every GPS fix. Keeps showing the previous
 * bake while a new one is in flight, so the map doesn't flicker or blank out.
 */
export function useTerrain(playerPosition: LatLon | null, origin: LatLon | null): TerrainState {
  const [state, setState] = useState<TerrainState>({
    heightfield: null,
    terrainImage: null,
    status: 'idle',
  });
  const lastCenterTileKey = useRef<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!playerPosition || !origin) return;
    const { x, y } = lonLatToTileFractional(playerPosition.lat, playerPosition.lon, TILE_ZOOM);
    const tileKey = `${Math.floor(x)},${Math.floor(y)}`;
    if (tileKey === lastCenterTileKey.current) return;
    lastCenterTileKey.current = tileKey;

    const thisRequest = ++requestId.current;
    setState((prev) => ({ ...prev, status: prev.status === 'ready' ? 'ready' : 'loading' }));

    buildLocalHeightfield(playerPosition, origin)
      .then((heightfield) => {
        if (requestId.current !== thisRequest) return; // superseded by a later move
        const terrainImage = renderDitheredTerrain(heightfield);
        setState({ heightfield, terrainImage, status: 'ready' });
      })
      .catch(() => {
        if (requestId.current !== thisRequest) return;
        setState((prev) => ({ ...prev, status: 'error' }));
      });
  }, [playerPosition, origin]);

  return state;
}
