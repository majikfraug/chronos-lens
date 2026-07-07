import { Canvas, Circle, Image as SkiaImage, Path, Skia, type SkImage } from '@shopify/react-native-skia';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { audio } from '../audio/engine';
import { ATTUNEMENT_GAIN, FIELD } from '../config/economy';
import { ditherCapturedStill } from '../lens/ditherStill';
import { cellKeyFor, toLocalMeters } from '../location/projection';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const HOLD_MS = 2200;
const RING_SIZE = 90;

/**
 * M2 Lens: live camera behind phosphor tint, temporal-density meter,
 * hold-to-stabilize scan, Bayer-dithered capture. The dither applies at
 * capture time — live per-frame dithering needs a dev-client build, see
 * docs/decisions.md (2026-07-06).
 */
export function LensScreen(): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const playerPosition = useGameStore((s) => s.playerPosition);
  const origin = useGameStore((s) => s.origin);
  const discoveredCells = useGameStore((s) => s.discoveredCells);
  const appendLog = useGameStore((s) => s.appendLog);
  const gainAttunement = useGameStore((s) => s.gainAttunement);

  const [density, setDensity] = useState(0.15);
  const [scaleRead, setScaleRead] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [still, setStill] = useState<SkImage | null>(null);
  const holdStart = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  // Temporal density drifts toward a base set by whether this ground is already
  // surveyed — ported from the prototype's density simulation; real heat economy
  // lands with classification.
  useEffect(() => {
    const iv = setInterval(() => {
      let base = 0.3;
      if (playerPosition && origin) {
        const meters = toLocalMeters(playerPosition, origin);
        const key = cellKeyFor(meters, FIELD.cellSizeM);
        base = discoveredCells.has(key) ? 0.38 : 0.62;
      }
      setDensity((d) => Math.max(0.08, Math.min(1, d + (Math.random() - 0.5) * 0.25 + (base - d) * 0.25)));
    }, 700);
    return () => clearInterval(iv);
  }, [playerPosition, origin, discoveredCells]);

  useEffect(() => {
    if (density > 0.42) {
      setScaleRead((prev) => (prev && Math.random() > 0.15 ? prev : Math.random() < 0.7 ? 'ARTIFACT' : 'FEATURE'));
    } else {
      setScaleRead(null);
    }
  }, [density]);

  const stopHold = (completed: boolean) => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    audio.scanStop();
    setScanning(false);
    setProgress(0);
    if (!completed) {
      setMessage('STABILIZATION INCOMPLETE');
      setTimeout(() => setMessage(''), 900);
    }
  };

  const onScanPressIn = () => {
    audio.kick();
    if (still || scanning) return;
    if (!scaleRead) {
      audio.play('deplete');
      setMessage('NO SUBJECT ACQUIRED · AWAIT DENSITY');
      setTimeout(() => setMessage(''), 1000);
      return;
    }
    setScanning(true);
    audio.scanStart();
    setMessage('STABILIZING');
    holdStart.current = Date.now();
    holdTimer.current = setInterval(() => {
      const p = Math.min(1, (Date.now() - holdStart.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        stopHold(true);
        void resolveCapture();
      }
    }, 50);
  };

  const resolveCapture = async () => {
    setMessage('RESOLVING');
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.3,
        shutterSound: false,
      });
      if (!photo?.base64) throw new Error('no capture data');
      const dithered = ditherCapturedStill(photo.base64);
      setStill(dithered);
      setMessage('');
      audio.play('resolve');
      appendLog('sys', 'CAPTURE RESOLVED · HELD FOR CLASSIFICATION');
      gainAttunement(ATTUNEMENT_GAIN.scan);
    } catch {
      audio.play('discard');
      setMessage('RESOLUTION FAILED · RETRY');
      setTimeout(() => setMessage(''), 1200);
    }
  };

  const ringPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc({ x: 4, y: 4, width: RING_SIZE - 8, height: RING_SIZE - 8 }, -90, 360 * progress);
    return path;
  }, [progress]);

  if (!permission?.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.telemetry}>
          {permission?.canAskAgain !== false
            ? 'OPTICAL ACCESS PENDING · AWAITING AUTHORIZATION'
            : 'OPTICAL ACCESS DENIED · ENABLE CAMERA IN SYSTEM SETTINGS'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stage}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" animateShutter={false} />
      {/* Phosphor cast over the raw feed; true per-frame dither arrives with a dev build. */}
      <View style={styles.tint} pointerEvents="none" />

      <View style={styles.hudTL} pointerEvents="none">
        <Text style={styles.hudText}>TEMPORAL DENSITY · LIVE</Text>
        <View style={styles.densityTrack}>
          <View style={[styles.densityFill, { width: `${density * 100}%` }]} />
        </View>
      </View>
      <Text style={[styles.hudText, styles.hudTR]} pointerEvents="none">
        SCALE READ: {scaleRead ?? '—'}
      </Text>

      {/* Reticle corners */}
      <View style={styles.reticle} pointerEvents="none">
        {(['c1', 'c2', 'c3', 'c4'] as const).map((c) => (
          <View key={c} style={[styles.corner, styles[c], scaleRead ? styles.cornerLocked : null]} />
        ))}
      </View>

      {scanning && (
        <View style={styles.ringWrap} pointerEvents="none">
          <Canvas style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={(RING_SIZE - 8) / 2}
              style="stroke"
              strokeWidth={3}
              color="rgba(157,184,154,0.15)"
            />
            <Path path={ringPath} style="stroke" strokeWidth={3} color={colors.neon} />
          </Canvas>
        </View>
      )}

      {message !== '' && (
        <Text style={styles.scanMsg} pointerEvents="none">
          {message}
        </Text>
      )}

      <Pressable style={styles.scanBtn} onPressIn={onScanPressIn} onPressOut={() => scanning && stopHold(false)}>
        <Text style={styles.scanBtnText}>HOLD · SCAN</Text>
      </Pressable>

      {still && (
        <View style={styles.resolve}>
          <Canvas style={styles.stillCanvas}>
            <SkiaImage image={still} x={0} y={0} width={300} height={225} fit="fill" />
          </Canvas>
          <Text style={styles.resolveText}>
            Form resolved and held in the capture buffer. No classification model exists yet — identification
            arrives with a later calibration.
          </Text>
          <Text style={styles.resolveNote}>CLASSIFICATION MODULE ARRIVES IN MILESTONE 3</Text>
          <Pressable
            style={styles.discardBtn}
            onPress={() => {
              audio.play('file');
              setStill(null);
            }}
          >
            <Text style={styles.discardText}>RETURN TO LENS</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { flex: 1, backgroundColor: '#060806', overflow: 'hidden' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: colors.bg,
  },
  telemetry: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.phosphorDim,
    textAlign: 'center',
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,20,11,0.32)',
  },
  hudTL: { position: 'absolute', top: 8, left: 10 },
  hudTR: { position: 'absolute', top: 8, right: 10 },
  hudText: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.phosphorDim,
  },
  densityTrack: {
    marginTop: 6,
    width: 80,
    height: 4,
    backgroundColor: 'rgba(21,26,19,0.8)',
  },
  densityFill: { height: '100%', backgroundColor: colors.neon },
  reticle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 120,
    marginLeft: -60,
    marginTop: -60,
  },
  // Chunky 3px strokes on 18px corners — reads as instrument overlay, not
  // vector UI, against the low-res feed (brief §6: lo-fi, never crisp-modern).
  corner: { position: 'absolute', width: 18, height: 18, borderColor: colors.phosphor, opacity: 0.75 },
  c1: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  c2: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  c3: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  c4: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cornerLocked: { borderColor: colors.neon },
  ringWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -RING_SIZE / 2,
    marginTop: -RING_SIZE / 2,
  },
  scanMsg: {
    position: 'absolute',
    bottom: 74,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.neon,
  },
  scanBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(113,232,201,0.4)',
    backgroundColor: 'rgba(16,20,15,0.85)',
  },
  scanBtnText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    letterSpacing: 2,
    color: colors.neon,
  },
  resolve: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11,14,11,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 14,
  },
  stillCanvas: { width: 300, height: 225, borderWidth: 1, borderColor: colors.line },
  resolveText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.phosphor,
    textAlign: 'center',
  },
  resolveNote: {
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.phosphorFaint,
  },
  discardBtn: {
    borderWidth: 1,
    borderColor: colors.phosphorDim,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  discardText: {
    fontFamily: fonts.body,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.bright,
  },
});
