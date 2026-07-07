import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocationTracking } from '../location/useLocationTracking';
import { toLocalMeters } from '../location/projection';
import { useGameStore } from '../state/gameStore';
import { useTerrain } from '../terrain/useTerrain';
import { colors } from '../theme/colors';
import { fonts, labelStyle } from '../theme/typography';
import { FieldMapCanvas } from './FieldMapCanvas';

/**
 * Meters visible across the view width, per zoom step (higher index = closer).
 * Extends the prototype's ZOOM_VIEW with 120m/70m walking-scale steps; defaults
 * near street level since this version is walked, not dragged.
 */
const ZOOM_VIEW_METRES = [1400, 900, 560, 340, 210, 120, 70];
const DEFAULT_ZOOM = 4;

const NICE_SCALE_METRES = [10, 25, 50, 100, 200, 250, 500, 1000];

export function FieldScreen(): React.JSX.Element {
  const locationStatus = useLocationTracking();
  const origin = useGameStore((s) => s.origin);
  const playerPosition = useGameStore((s) => s.playerPosition);
  const revealedCells = useGameStore((s) => s.revealedCells);

  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  const { heightfield, terrainImage, status: terrainStatus } = useTerrain(playerPosition, origin);

  const viewMetres = ZOOM_VIEW_METRES[zoom];

  const playerMeters = useMemo(
    () => (playerPosition && origin ? toLocalMeters(playerPosition, origin) : null),
    [playerPosition, origin]
  );

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStageSize({ width, height });
  };

  const niceScale = NICE_SCALE_METRES.reduce((best, candidate) => {
    const target = viewMetres / 5;
    return Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best;
  }, NICE_SCALE_METRES[0]);
  const pxPerMeter = stageSize.width / viewMetres;
  const scaleBarWidth = niceScale * pxPerMeter;

  return (
    <View style={styles.stage} onLayout={onStageLayout}>
      {stageSize.width > 0 && playerMeters ? (
        <FieldMapCanvas
          width={stageSize.width}
          height={stageSize.height}
          terrainImage={terrainImage}
          heightfield={heightfield}
          playerMeters={playerMeters}
          revealedCells={revealedCells}
          viewMetres={viewMetres}
        />
      ) : (
        <View style={styles.telemetryWrap}>
          <Text style={styles.telemetryLine}>{telemetryFor(locationStatus)}</Text>
        </View>
      )}

      <View style={styles.fieldInfo} pointerEvents="none">
        <Text style={styles.fieldInfoText}>
          POSITION ·{' '}
          <Text style={styles.fieldInfoValue}>
            {playerMeters ? `${Math.round(playerMeters.x)}, ${Math.round(playerMeters.y)}` : 'UNTRACKED'}
          </Text>
          {terrainStatus === 'loading' ? '  ·  SURVEYING SECTOR…' : ''}
        </Text>
      </View>

      <View style={styles.zoomBtns}>
        <Pressable
          style={styles.zoomBtn}
          onPress={() => setZoom((z) => Math.min(ZOOM_VIEW_METRES.length - 1, z + 1))}
          disabled={zoom === ZOOM_VIEW_METRES.length - 1}
        >
          <Text style={styles.zoomBtnText}>+</Text>
        </Pressable>
        <Pressable
          style={styles.zoomBtn}
          onPress={() => setZoom((z) => Math.max(0, z - 1))}
          disabled={zoom === 0}
        >
          <Text style={styles.zoomBtnText}>−</Text>
        </Pressable>
      </View>

      <View style={styles.legend} pointerEvents="none">
        <Text style={styles.legendText}>{playerPosition ? formatLatLon(playerPosition) : '—'}</Text>
        <View style={styles.scaleGroup}>
          <View style={[styles.scaleLine, { width: scaleBarWidth }]} />
          <Text style={styles.legendText}>{niceScale} m</Text>
        </View>
      </View>
    </View>
  );
}

function formatLatLon(p: { lat: number; lon: number }): string {
  const lat = `${Math.abs(p.lat).toFixed(5)}° ${p.lat >= 0 ? 'N' : 'S'}`;
  const lon = `${Math.abs(p.lon).toFixed(5)}° ${p.lon >= 0 ? 'E' : 'W'}`;
  return `${lat} · ${lon}`;
}

function telemetryFor(status: ReturnType<typeof useLocationTracking>): string {
  switch (status) {
    case 'requesting':
      return 'AWAITING POSITION LOCK …';
    case 'denied':
      return 'POSITION ACCESS DENIED · FIELD SURVEY UNAVAILABLE';
    case 'error':
      return 'POSITION SIGNAL LOST';
    case 'granted':
    default:
      return 'ACQUIRING FIRST FIX …';
  }
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: '#070907',
    overflow: 'hidden',
  },
  telemetryWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  telemetryLine: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.phosphorDim,
    textAlign: 'center',
  },
  fieldInfo: {
    position: 'absolute',
    top: 8,
    left: 10,
  },
  fieldInfoText: {
    ...labelStyle,
    fontSize: 9,
    color: colors.phosphorDim,
  },
  fieldInfoValue: {
    color: colors.phosphor,
    fontFamily: fonts.bodyMedium,
  },
  zoomBtns: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 4,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,20,15,0.85)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  zoomBtnText: {
    color: colors.phosphor,
    fontFamily: fonts.body,
    fontSize: 17,
  },
  legend: {
    position: 'absolute',
    bottom: 6,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    ...labelStyle,
    fontSize: 9,
    color: colors.phosphorDim,
  },
  scaleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  scaleLine: {
    height: 5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.phosphorDim,
  },
});
