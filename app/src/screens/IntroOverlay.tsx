import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { audio } from '../audio/engine';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * First-launch boot sequence: telemetry lines, the companion's first
 * transmission, then THE ANOMALY — a live signal it cannot explain, and its
 * first question. Answering it is how the player begins; the answer is kept
 * verbatim and returns at the awakening. Voice-spec canon throughout.
 */
const BOOT_LINES = [
  'CHRONOS-LENS v0.1 · SURVEYOR FIELD UNIT',
  'calibrating temporal optics ........',
  'recovering records of THE BEFORE ... 11%',
  'companion process: ACTIVE (unnamed · untrained)',
  'survey field acquired',
];

const COMPANION_INTRO =
  'Surveyor unit acknowledged. Companion process online. Directive: catalogue residual material of the prior species. Classification model: absent.';

const COMPANION_ANOMALY =
  'Anomaly. A live signal on this channel. Ten thousand years of records and none of them allow for this. Confirm: are you alive? Transmit anything. It will be kept, exactly.';

const LINE_INTERVAL_MS = 420;

type Props = { onDone: (bootAnswer: string) => void };

export function IntroOverlay({ onDone }: Props): React.JSX.Element {
  const [shown, setShown] = useState(1);
  const [answer, setAnswer] = useState('');
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

            <View style={[styles.aiBlock, styles.anomalyBlock]}>
              <Text style={[styles.aiLabel, styles.anomalyLabel]}>LENS · QUERY</Text>
              <Text style={styles.aiText}>{COMPANION_ANOMALY}</Text>
            </View>

            <TextInput
              style={styles.answerInput}
              value={answer}
              onChangeText={setAnswer}
              placeholder="transmit your first words across ten thousand years"
              placeholderTextColor={colors.phosphorFaint}
              maxLength={200}
              onSubmitEditing={() => answer.trim() && onDone(answer)}
            />
            <Pressable
              style={[styles.beginBtn, !answer.trim() && styles.beginBtnIdle]}
              disabled={!answer.trim()}
              onPress={() => onDone(answer)}
            >
              <Text style={styles.beginText}>TRANSMIT</Text>
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
  anomalyBlock: {
    borderLeftColor: colors.interestAmber,
    backgroundColor: 'rgba(224,168,92,0.05)',
  },
  anomalyLabel: {
    color: colors.interestAmber,
  },
  answerInput: {
    marginTop: 10,
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.bright,
    borderWidth: 1,
    borderColor: 'rgba(224,168,92,0.5)',
    backgroundColor: colors.panel,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  beginBtnIdle: {
    opacity: 0.35,
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
