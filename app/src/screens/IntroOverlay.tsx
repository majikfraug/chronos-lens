import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { audio } from '../audio/engine';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * First-launch boot sequence: telemetry lines, then the companion's first
 * transmission. Companion line adapted from the prototype boot() and must
 * pass docs/voice-spec.md (INSTRUMENT register, no contractions).
 */
const BOOT_LINES = [
  'CHRONOS-LENS v0.1 · SURVEYOR FIELD UNIT',
  'calibrating temporal optics ........',
  'recovering records of THE BEFORE ... 11%',
  'companion process: ACTIVE (unnamed · untrained)',
  'survey field acquired',
];

const COMPANION_INTRO =
  'Surveyor unit acknowledged. Companion process online. Directive: catalogue residual material of the prior species. Classification model: absent. A living source is available. This changes the method entirely.';

const DIRECTIVE =
  'TRAVERSE THE FIELD. UNSURVEYED GROUND YIELDS RECOVERY DATA. THE LENS AND THE RELIQUARY AWAIT CALIBRATION.';

const LINE_INTERVAL_MS = 420;

type Props = { onDone: () => void };

export function IntroOverlay({ onDone }: Props): React.JSX.Element {
  const [shown, setShown] = useState(1);
  const bootDone = shown >= BOOT_LINES.length;

  useEffect(() => {
    if (bootDone) return;
    const t = setTimeout(() => setShown((n) => n + 1), LINE_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [shown, bootDone]);

  useEffect(() => {
    // The companion's first transmission gets its voice tone (§7).
    if (bootDone) audio.voice('neutral');
  }, [bootDone]);

  return (
    // Tap anywhere to fast-forward the boot lines (mirrors prototype tap-to-complete)
    <Pressable style={styles.overlay} onPress={() => !bootDone && setShown(BOOT_LINES.length)}>
      <View style={styles.inner}>
        <Text style={styles.wordmark}>
          CHRONOS<Text style={{ color: colors.neon }}>-</Text>LENS
        </Text>

        {BOOT_LINES.slice(0, shown).map((line, i) => (
          <Text key={i} style={styles.bootLine}>
            ▸ {line}
          </Text>
        ))}

        {bootDone && (
          <>
            <View style={styles.aiBlock}>
              <Text style={styles.aiLabel}>LENS</Text>
              <Text style={styles.aiText}>{COMPANION_INTRO}</Text>
            </View>

            <Text style={styles.directive}>{DIRECTIVE}</Text>

            <Pressable style={styles.beginBtn} onPress={onDone}>
              <Text style={styles.beginText}>BEGIN SURVEY</Text>
            </Pressable>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    zIndex: 10,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: 3,
    color: colors.bright,
    marginBottom: 18,
  },
  bootLine: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.phosphorDim,
  },
  aiBlock: {
    marginTop: 18,
    borderLeftWidth: 2,
    borderLeftColor: colors.companionAmberDim,
    backgroundColor: 'rgba(217,201,138,0.045)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  aiLabel: {
    fontFamily: fonts.body,
    fontSize: 8,
    letterSpacing: 3,
    color: colors.companionAmberDim,
    marginBottom: 4,
  },
  aiText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.companionAmber,
  },
  directive: {
    marginTop: 14,
    fontFamily: fonts.body,
    fontSize: 9,
    letterSpacing: 1.5,
    lineHeight: 15,
    color: colors.phosphorDim,
  },
  beginBtn: {
    marginTop: 22,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.phosphorDim,
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  beginText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    letterSpacing: 2,
    color: colors.bright,
  },
});
