import React, { useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
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
  /** View offset from the player, meters — drag to survey elsewhere; {0,0} = locked on. */
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const { heightfield, terrainImage, status: terrainStatus } = useTerrain(playerPosition, origin);

  const viewMetres = ZOOM_VIEW_METRES[zoom];

  const playerMeters = useMemo(
    () => (playerPosition && origin ? toLocalMeters(playerPosition, origin) : null),
    [playerPosition, origin]
  );

  // Refs so the PanResponder (created once) always sees current values.
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef(panOffset);
  panOffsetRef.current = panOffset;
  const mppRef = useRef(1);
  mppRef.current = stageSize.width > 0 ? viewMetres / stageSize.width : 1;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, g) => Math.abs(g.dx) + Math.abs(g.dy) > 8,
      onPanResponderGrant: () => {
        panStart.current = panOffsetRef.current;
      },
      onPanResponderMove: (_evt, g) => {
        // Content follows the finger: screen +x drag looks west, +y drag looks north.
        setPanOffset({
          x: panStart.current.x - g.dx * mppRef.current,
          y: panStart.current.y + g.dy * mppRef.current,
        });
      },
    })
  ).current;

  const isPanned = Math.abs(panOffset.x) > 1 || Math.abs(panOffset.y) > 1;

  const nudge = (dx: number, dy: number) => {
    const step = viewMetres * 0.3;
    setPanOffset((o) => ({ x: o.x + dx * step, y: o.y + dy * step }));
  };

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
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          <FieldMapCanvas
            width={stageSize.width}
            height={stageSize.height}
            terrainImage={terrainImage}
            heightfield={heightfield}
            playerMeters={playerMeters}
            centerMeters={{ x: playerMeters.x + panOffset.x, y: playerMeters.y + panOffset.y }}
            revealedCells={revealedCells}
            viewMetres={viewMetres}
          />
        </View>
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

      {/* Pan pad: step the view by ~30% of the visible width; ⌖ snaps home. */}
      <View style={styles.panPad}>
        <View style={styles.panRow}>
          <View style={styles.panSpacer} />
          <PanBtn label="▲" onPress={() => nudge(0, 1)} />
          <View style={styles.panSpacer} />
        </View>
        <View style={styles.panRow}>
          <PanBtn label="◀" onPress={() => nudge(-1, 0)} />
          <Pressable
            style={[styles.panBtn, !isPanned && styles.panBtnIdle]}
            onPress={() => setPanOffset({ x: 0, y: 0 })}
            disabled={!isPanned}
          >
            <Text style={[styles.zoomBtnText, isPanned && { color: colors.neon }]}>⌖</Text>
          </Pressable>
          <PanBtn label="▶" onPress={() => nudge(1, 0)} />
        </View>
        <View style={styles.panRow}>
          <View style={styles.panSpacer} />
          <PanBtn label="▼" onPress={() => nudge(0, -1)} />
          <View style={styles.panSpacer} />
        </View>
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

function PanBtn({ label, onPress }: { label: string; onPress: () => void }): React.JSX.Element {
  return (
    <Pressable style={styles.panBtn} onPress={onPress} hitSlop={2}>
      <Text style={styles.panBtnText}>{label}</Text>
    </Pressable>
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
  panPad: {
    position: 'absolute',
    right: 8,
    bottom: 26,
    gap: 3,
  },
  panRow: {
    flexDirection: 'row',
    gap: 3,
  },
  panSpacer: { width: 30, height: 30 },
  panBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16,20,15,0.85)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  panBtnIdle: { opacity: 0.4 },
  panBtnText: {
    color: colors.phosphorDim,
    fontFamily: fonts.body,
    fontSize: 11,
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
