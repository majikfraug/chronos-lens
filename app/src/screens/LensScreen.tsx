import {
  Canvas,
  Circle,
  Image as SkiaImage,
  Path,
  Skia,
  type SkImage,
} from '@shopify/react-native-skia';
import { CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { audio } from '../audio/engine';
import { FIELD } from '../config/economy';
import {
  poolForScale,
  proposeType,
  TEACH_PHASE,
  TEACH_PROMPT_FIRST,
  TEACH_PROMPT_LATER,
  type Scale,
  type TypeName,
} from '../config/taxonomy';
import { ditherCapturedStill } from '../lens/ditherStill';
import { cellKeyFor, toLocalMeters } from '../location/projection';
import { useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

const HOLD_MS = 2200;
const RING_SIZE = 90;
/** Capture window width as a fraction of the stage — the framed region IS what gets dithered. */
const WINDOW_FRAC = 0.72;

type Proposal = { scale: Scale; type: TypeName | null; confidence: number };
type Chosen = { scale: Scale; type: TypeName | null };

/**
 * M2/M3 Lens: live camera behind phosphor tint, temporal-density meter,
 * hold-to-stabilize scan into the training-first classification flow
 * (brief §2.3): first TEACH_PHASE scans the player identifies; thereafter the
 * companion proposes from taught counts and the player confirms or corrects.
 */
export function LensScreen(): React.JSX.Element {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const playerPosition = useGameStore((s) => s.playerPosition);
  const origin = useGameStore((s) => s.origin);
  const discoveredCells = useGameStore((s) => s.discoveredCells);
  const appendLog = useGameStore((s) => s.appendLog);
  const taughtCounts = useGameStore((s) => s.taughtCounts);
  const taughtTotal = useGameStore((s) => s.taughtTotal);
  const confirmScan = useGameStore((s) => s.confirmScan);
  const calibLensResolved = useGameStore((s) => s.calibLensResolved);
  const customTypes = useGameStore((s) => s.customTypes);
  const defineCustomType = useGameStore((s) => s.defineCustomType);

  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [density, setDensity] = useState(0.15);
  const [scaleRead, setScaleRead] = useState<Scale | null>(null);
  const [progress, setProgress] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState('');
  const [still, setStill] = useState<SkImage | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [teachMode, setTeachMode] = useState(false);
  const [defineOpen, setDefineOpen] = useState(false);
  const [defineName, setDefineName] = useState('');
  const holdStart = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const windowW = stage.width * WINDOW_FRAC;
  const windowH = windowW * 0.75; // 4:3, matching the 128×96 dither feed

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) void requestPermission();
  }, [permission, requestPermission]);

  // Temporal density drifts toward a base set by whether this ground is already
  // surveyed — ported from the prototype's density simulation; the full heat
  // economy (per-cell scan depletion/regen) is still to come.
  useEffect(() => {
    const iv = setInterval(() => {
      let base = 0.3;
      if (playerPosition && origin) {
        const meters = toLocalMeters(playerPosition, origin);
        const key = cellKeyFor(meters, FIELD.cellSizeM);
        base = discoveredCells.has(key) ? 0.38 : 0.62;
      }
      setDensity((d) =>
        Math.max(0.08, Math.min(1, d + (Math.random() - 0.5) * 0.25 + (base - d) * 0.25))
      );
    }, 700);
    return () => clearInterval(iv);
  }, [playerPosition, origin, discoveredCells]);

  useEffect(() => {
    if (density > 0.42) {
      setScaleRead((prev) =>
        prev && Math.random() > 0.15 ? prev : Math.random() < 0.7 ? 'ARTIFACT' : 'FEATURE'
      );
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
    const capturedScale: Scale = scaleRead ?? 'ARTIFACT';
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        base64: true,
        quality: 0.3,
        shutterSound: false,
      });
      if (!photo?.base64) throw new Error('no capture data');
      const dithered = ditherCapturedStill(
        photo.base64,
        stage.width > 0 ? { viewW: stage.width, viewH: stage.height, windowW, windowH } : undefined
      );
      setStill(dithered);
      setMessage('');
      audio.reassert(); // the capture session may have displaced the playback session
      audio.play('resolve');
      calibLensResolved();

      const teach = taughtTotal < TEACH_PHASE;
      setTeachMode(teach);
      if (teach) {
        setProposal({ scale: capturedScale, type: null, confidence: 0 });
        setChosen({ scale: capturedScale, type: null });
        const prompt = taughtTotal === 0 ? TEACH_PROMPT_FIRST : TEACH_PROMPT_LATER;
        appendLog('ai', prompt.text);
        audio.voice(prompt.mood);
      } else {
        const p = proposeType(capturedScale, taughtCounts, customTypes);
        setProposal({ scale: capturedScale, type: p.type, confidence: p.confidence });
        setChosen({ scale: capturedScale, type: p.type });
        const band = p.confidence > 0.75 ? 'high' : p.confidence > 0.5 ? 'moderate' : 'low';
        appendLog(
          'ai',
          `Reading suggests: ${p.type.toLowerCase()}. Confidence: ${band} — model built from ${taughtTotal} of your identifications. Confirm or correct.`
        );
        audio.voice('neutral');
      }
    } catch {
      audio.play('discard');
      setMessage('RESOLUTION FAILED · RETRY');
      setTimeout(() => setMessage(''), 1200);
    }
  };

  const closeResolve = () => {
    setStill(null);
    setProposal(null);
    setChosen(null);
    setDefineOpen(false);
    setDefineName('');
  };

  const onDefineType = async () => {
    const clean = defineName.trim().toUpperCase().slice(0, 24);
    if (!clean || !chosen) return;
    await defineCustomType(clean, chosen.scale);
    setChosen({ ...chosen, type: clean });
    setDefineOpen(false);
    setDefineName('');
  };

  const onConfirm = async () => {
    if (!still || !proposal || !chosen?.type) return;
    const corrected =
      !teachMode && (chosen.type !== proposal.type || chosen.scale !== proposal.scale);
    const thumbPng = still.encodeToBytes();
    closeResolve();
    await confirmScan({
      scale: chosen.scale,
      type: chosen.type,
      taught: teachMode,
      corrected,
      thumbPng,
    });
  };

  const onDiscard = () => {
    audio.play('discard');
    appendLog('sys', 'CAPTURE DISCARDED');
    closeResolve();
  };

  const pickScale = (s: Scale) => {
    if (!chosen) return;
    if (chosen.scale === s) return;
    const pool = poolForScale(s, customTypes);
    const keepType = chosen.type && pool.includes(chosen.type) ? chosen.type : teachMode ? null : pool[0];
    setChosen({ scale: s, type: keepType });
  };

  const ringPath = useMemo(() => {
    const path = Skia.Path.Make();
    path.addArc({ x: 4, y: 4, width: RING_SIZE - 8, height: RING_SIZE - 8 }, -90, 360 * progress);
    return path;
  }, [progress]);

  const onStageLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setStage({ width, height });
  };

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

  const typePool = chosen ? poolForScale(chosen.scale, customTypes) : [];

  return (
    <View style={styles.stage} onLayout={onStageLayout}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        animateShutter={false}
      />
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

      {/* Capture window — this framed region is exactly what resolves into the record. */}
      {stage.width > 0 && (
        <View
          style={[
            styles.captureWindow,
            {
              width: windowW,
              height: windowH,
              marginLeft: -windowW / 2,
              marginTop: -windowH / 2,
              borderColor: scaleRead ? 'rgba(113,232,201,0.45)' : 'rgba(157,184,154,0.3)',
            },
          ]}
          pointerEvents="none"
        >
          {(['c1', 'c2', 'c3', 'c4'] as const).map((c) => (
            <View key={c} style={[styles.corner, styles[c], scaleRead ? styles.cornerLocked : null]} />
          ))}
        </View>
      )}

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

      {!still && (
        <Pressable
          style={styles.scanBtn}
          onPressIn={onScanPressIn}
          onPressOut={() => scanning && stopHold(false)}
        >
          <Text style={styles.scanBtnText}>HOLD · SCAN</Text>
        </Pressable>
      )}

      {still && proposal && chosen && (
        <View style={styles.resolve}>
          <ScrollView contentContainerStyle={styles.resolveInner}>
            <Canvas style={{ width: windowW, height: windowH, borderWidth: 1, borderColor: colors.line }}>
              <SkiaImage image={still} x={0} y={0} width={windowW} height={windowH} fit="fill" />
            </Canvas>

            <Text style={styles.propLine}>
              SCALE: <Text style={styles.propValue}>{chosen.scale}</Text>
              {!teachMode && chosen.scale !== proposal.scale ? (
                <Text style={styles.corrTag}> · CORRECTED</Text>
              ) : null}
            </Text>
            <View style={styles.chipRow}>
              {(['ARTIFACT', 'FEATURE'] as const).map((s) => (
                <Pressable
                  key={s}
                  style={[
                    styles.chip,
                    s === proposal.scale && styles.chipProposed,
                    s === chosen.scale && styles.chipSelected,
                  ]}
                  onPress={() => pickScale(s)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      s === proposal.scale && styles.chipTextProposed,
                      s === chosen.scale && styles.chipTextSelected,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.propLine}>
              {teachMode ? (
                <>
                  IDENTIFY THE FORM · <Text style={styles.corrTag}>TRAINING</Text>
                </>
              ) : (
                <>
                  READING: <Text style={styles.propValue}>{proposal.type}</Text> · CONF{' '}
                  {Math.round(proposal.confidence * 100)}%
                </>
              )}
            </Text>
            <View style={styles.chipRow}>
              {typePool.map((t) => (
                <Pressable
                  key={t}
                  style={[
                    styles.chip,
                    t === proposal.type && styles.chipProposed,
                    t === chosen.type && styles.chipSelected,
                  ]}
                  onPress={() => setChosen({ ...chosen, type: t })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      t === proposal.type && styles.chipTextProposed,
                      t === chosen.type && styles.chipTextSelected,
                    ]}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
              <Pressable style={[styles.chip, styles.chipDefine]} onPress={() => setDefineOpen((v) => !v)}>
                <Text style={[styles.chipText, { color: colors.interestAmber }]}>+ DEFINE</Text>
              </Pressable>
            </View>

            {defineOpen && (
              <View style={styles.defineRow}>
                <TextInput
                  style={styles.defineInput}
                  value={defineName}
                  onChangeText={setDefineName}
                  placeholder="name a new category"
                  placeholderTextColor={colors.phosphorFaint}
                  autoCapitalize="characters"
                  autoFocus
                  maxLength={24}
                  onSubmitEditing={() => void onDefineType()}
                />
                <Pressable
                  style={[styles.actionBtn, styles.defineBtn, !defineName.trim() && styles.btnDisabled]}
                  disabled={!defineName.trim()}
                  onPress={() => void onDefineType()}
                >
                  <Text style={styles.actionTextDim}>ADD</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.confirmRow}>
              <Pressable
                style={[styles.actionBtn, styles.primaryBtn, !chosen.type && styles.btnDisabled]}
                disabled={!chosen.type}
                onPress={() => void onConfirm()}
              >
                <Text style={styles.actionText}>CONFIRM</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={onDiscard}>
                <Text style={styles.actionTextDim}>DISCARD</Text>
              </Pressable>
            </View>
          </ScrollView>
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
  captureWindow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderWidth: 1,
  },
  corner: { position: 'absolute', width: 18, height: 18, borderColor: colors.phosphor, opacity: 0.75 },
  c1: { top: -3, left: -3, borderTopWidth: 3, borderLeftWidth: 3 },
  c2: { top: -3, right: -3, borderTopWidth: 3, borderRightWidth: 3 },
  c3: { bottom: -3, left: -3, borderBottomWidth: 3, borderLeftWidth: 3 },
  c4: { bottom: -3, right: -3, borderBottomWidth: 3, borderRightWidth: 3 },
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
  },
  resolveInner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  propLine: {
    alignSelf: 'flex-start',
    fontFamily: fonts.body,
    fontSize: 10.5,
    letterSpacing: 1,
    color: colors.phosphorDim,
  },
  propValue: {
    color: colors.phosphor,
    fontFamily: fonts.bodyMedium,
  },
  corrTag: { color: colors.interestAmber },
  chipRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  chip: {
    backgroundColor: colors.panel2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: 8,
    paddingHorizontal: 9,
  },
  chipProposed: { borderColor: 'rgba(113,232,201,0.5)' },
  chipDefine: { borderColor: 'rgba(224,168,92,0.45)', borderStyle: 'dashed' },
  defineRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 6,
  },
  defineInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.bright,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel2,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  defineBtn: { flex: 0, paddingHorizontal: 16 },
  chipSelected: { backgroundColor: colors.phosphorFaint, borderColor: colors.phosphor },
  chipText: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    letterSpacing: 0.5,
    color: colors.phosphorDim,
  },
  chipTextProposed: { color: colors.neon },
  chipTextSelected: { color: colors.bright },
  confirmRow: {
    flexDirection: 'row',
    gap: 7,
    alignSelf: 'stretch',
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.panel2,
  },
  primaryBtn: { borderColor: colors.phosphorDim },
  btnDisabled: { opacity: 0.35 },
  actionText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    letterSpacing: 1,
    color: colors.bright,
  },
  actionTextDim: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    letterSpacing: 1,
    color: colors.phosphor,
  },
});
