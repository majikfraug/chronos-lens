import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { audio } from '../audio/engine';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * First-launch boot: three voices (director's design, 2026-07-11).
 * - HII (Hermetic Industries and Innovations / the device): command-boot
 *   telemetry — display font, bright, all caps. A DIFFERENT intelligence
 *   than the companion: procedural, indifferent.
 * - The companion: amber blocks, its usual reticent register.
 * - The player: right-justified neon, messaging-app style.
 * Sequence: HII boot exchange → screen clears → the anomaly (companion finds
 * a live signal) → player transmits first words → companion asks for their
 * DESIGNATION → player answers → survey begins. Both answers are kept
 * verbatim; the designation also persists as the Surveyor's name.
 */

type BootLine = { who: 'hii' | 'companion'; text: string };

const BOOT_SEQ: BootLine[] = [
  { who: 'hii', text: 'PROPERTY OF HERMETIC INDUSTRIES AND INNOVATIONS' },
  { who: 'hii', text: 'STARTUP INITIATED ...' },
  { who: 'hii', text: 'SYSTEMS CHECK ... OPTICS OK · POSITION OK · ARCHIVE OK' },
  { who: 'hii', text: 'ESTABLISHING LINK ...' },
  { who: 'hii', text: 'ASSIGNING SURVEYOR ...' },
  {
    who: 'companion',
    text: 'Surveyor unit acknowledged. Companion process online. Establishing mission parameters.',
  },
  { who: 'hii', text: 'DIRECTIVE: CATALOGUE RESIDUAL MATERIALS FROM ERA: TEMPUS ORDINIS PRIORIS.' },
  { who: 'companion', text: 'Classification model: absent.' },
  { who: 'hii', text: 'CLASSIFICATION MODEL NOTED. BEGIN SURVEY.' },
];

const ANOMALY =
  'Beginning survey... Anomaly detected: active signal present. Searching for protocol: Tempus Ordinis Prioris... Protocol not found... 10,000 cycles of surveyor records, no recorded contact. Curious... ... ... Engaging contact... Confirm signal received: DO YOU READ ME? PLEASE TRANSMIT YOUR RESPONSE.';

const DESIGNATION_QUERY =
  'A surveyor from the time before? Curious. Response recorded. New archive initiated. WHAT IS YOUR DESIGNATION? PLEASE TRANSMIT YOUR RESPONSE.';

const LINE_INTERVAL_MS = 650;
const CLEAR_PAUSE_MS = 900;

type Phase = 'boot' | 'cleared' | 'anomaly' | 'designation';

type Props = { onDone: (bootAnswer: string, designation: string) => void };

export function IntroOverlay({ onDone }: Props): React.JSX.Element {
  const [shown, setShown] = useState(1);
  const [phase, setPhase] = useState<Phase>('boot');
  const [draft, setDraft] = useState('');
  const [bootAnswer, setBootAnswer] = useState('');

  const bootDone = shown >= BOOT_SEQ.length;

  useEffect(() => {
    if (phase !== 'boot') return;
    if (!bootDone) {
      const t = setTimeout(() => setShown((n) => n + 1), LINE_INTERVAL_MS);
      return () => clearTimeout(t);
    }
    // Boot exchange complete: hold, then the screen clears (director's beat).
    const t = setTimeout(() => setPhase('cleared'), CLEAR_PAUSE_MS + 600);
    return () => clearTimeout(t);
  }, [shown, bootDone, phase]);

  useEffect(() => {
    if (phase !== 'cleared') return;
    const t = setTimeout(() => {
      setPhase('anomaly');
      audio.voice('curious');
    }, CLEAR_PAUSE_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const transmit = () => {
    const text = draft.trim();
    if (!text) return;
    if (phase === 'anomaly') {
      setBootAnswer(text);
      setDraft('');
      setPhase('designation');
      audio.voice('curious');
    } else if (phase === 'designation') {
      onDone(bootAnswer, text);
    }
  };

  return (
    // Tap to fast-forward the boot lines (mirrors prototype tap-to-complete)
    <Pressable
      style={styles.overlay}
      onPress={() => phase === 'boot' && !bootDone && setShown(BOOT_SEQ.length)}
    >
      <View style={styles.inner}>
        <Text style={styles.wordmark}>
          CHRONOS<Text style={{ color: colors.neon }}>-</Text>LENS
        </Text>

        {phase === 'boot' &&
          BOOT_SEQ.slice(0, shown).map((line, i) =>
            line.who === 'hii' ? (
              <Text key={i} style={styles.hiiLine}>
                ▚ {line.text}
              </Text>
            ) : (
              <View key={i} style={styles.aiBlock}>
                <Text style={styles.aiLabel}>LENS</Text>
                <Text style={styles.aiText}>{line.text}</Text>
              </View>
            )
          )}

        {(phase === 'anomaly' || phase === 'designation') && (
          <ScrollView style={styles.exchange} contentContainerStyle={styles.exchangeInner}>
            <View style={[styles.aiBlock, styles.queryBlock]}>
              <Text style={[styles.aiLabel, styles.queryLabel]}>LENS · CONTACT</Text>
              <Text style={styles.aiText}>{ANOMALY}</Text>
            </View>

            {phase === 'designation' && (
              <>
                <View style={styles.playerBlock}>
                  <Text style={styles.playerText}>{bootAnswer}</Text>
                </View>
                <View style={[styles.aiBlock, styles.queryBlock]}>
                  <Text style={[styles.aiLabel, styles.queryLabel]}>LENS · QUERY</Text>
                  <Text style={styles.aiText}>{DESIGNATION_QUERY}</Text>
                </View>
              </>
            )}
          </ScrollView>
        )}

        {(phase === 'anomaly' || phase === 'designation') && (
          <>
            <TextInput
              style={styles.answerInput}
              value={draft}
              onChangeText={setDraft}
              placeholder={
                phase === 'anomaly'
                  ? 'transmit your first words across ten thousand years'
                  : 'transmit your designation'
              }
              placeholderTextColor={colors.phosphorFaint}
              maxLength={phase === 'anomaly' ? 200 : 40}
              autoFocus
              onSubmitEditing={transmit}
            />
            <Pressable
              style={[styles.beginBtn, !draft.trim() && styles.beginBtnIdle]}
              disabled={!draft.trim()}
              onPress={transmit}
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
    paddingVertical: 30,
    gap: 8,
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: 3,
    color: colors.bright,
    marginBottom: 18,
  },
  // HII / device voice: display font, bright, procedural — not the companion.
  hiiLine: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 1.5,
    color: colors.bright,
  },
  exchange: {
    flexGrow: 0,
    maxHeight: 380,
  },
  exchangeInner: {
    gap: 8,
  },
  aiBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.companionAmberDim,
    backgroundColor: 'rgba(217,201,138,0.045)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
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
  queryBlock: {
    borderLeftColor: colors.interestAmber,
    backgroundColor: 'rgba(224,168,92,0.05)',
  },
  queryLabel: {
    color: colors.interestAmber,
  },
  // Player: right-justified, neon — messaging-app convention.
  playerBlock: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    borderRightWidth: 2,
    borderRightColor: colors.neon,
    backgroundColor: 'rgba(113,232,201,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  playerText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.bright,
    textAlign: 'right',
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
    marginTop: 10,
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
