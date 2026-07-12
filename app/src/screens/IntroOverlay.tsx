import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { audio } from '../audio/engine';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

/**
 * First boot as a TRANSMISSION ACROSS TIME (director's pacing design,
 * 2026-07-11): everything types out slowly; the HII boot interleaves bursts
 * of code-noise and shows Hermetic's processing indicator — an 8-bit winged
 * boot, wings flapping (the talaria of Hermes; Hermetic Industries' beach
 * ball). Lines ending in an ellipsis blink it a few times before the next
 * line begins. Tap anywhere to complete the current line early.
 *
 * Voices: HII (display font, bright, caps) · companion (amber) · player
 * (right-justified neon).
 */

type Seg = { who: 'hii' | 'companion' | 'noise'; text: string };

const HEX = '0123456789ABCDEF';
function noiseLine(): string {
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += `${HEX[Math.floor(Math.random() * 16)]}${HEX[Math.floor(Math.random() * 16)]} `;
  }
  return `▒ 0x${s.trim()} ▒`;
}

function withNoise(lines: Seg[]): Seg[] {
  const out: Seg[] = [];
  for (const line of lines) {
    out.push(line);
    if (line.who === 'hii') {
      const bursts = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < bursts; i++) out.push({ who: 'noise', text: noiseLine() });
    }
  }
  return out;
}

const BOOT_SEQ: Seg[] = [
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

/** Each ellipsis-terminated statement is its own line; the ellipsis blinks. */
const ANOMALY_SEGS: Seg[] = [
  { who: 'companion', text: 'Beginning survey...' },
  { who: 'companion', text: 'Anomaly detected: active signal present.' },
  { who: 'companion', text: 'Searching for protocol: Tempus Ordinis Prioris...' },
  { who: 'companion', text: 'Protocol not found...' },
  { who: 'companion', text: '10,000 cycles of surveyor records, no recorded contact.' },
  { who: 'companion', text: 'Curious...' },
  { who: 'companion', text: '...' },
  { who: 'companion', text: 'Engaging contact...' },
  {
    who: 'companion',
    text: 'Verify signal transmission: PLEASE CONFIRM THIS COMMUNICATION HAS BEEN RECEIVED.',
  },
];

const DESIGNATION_SEGS: Seg[] = [
  { who: 'companion', text: 'A surveyor from the time before?' },
  { who: 'companion', text: 'Curious...' },
  { who: 'companion', text: 'Response recorded. New archive initiated.' },
  { who: 'companion', text: 'WHAT IS YOUR DESIGNATION? PLEASE TRANSMIT YOUR RESPONSE.' },
];

const TYPE_MS_HII = 26;
const TYPE_MS_COMPANION = 34;
const LINE_PAUSE_MS = 650;
const NOISE_MS = 90;
const BLINK_TOGGLES = 6; // 3 visible blinks
const BLINK_MS = 320;

/** 8-bit winged boot, two frames (wings up / wings down). 1 = boot, 2 = wing. */
const BOOT_FRAME_A = [
  '00200000000',
  '02200000000',
  '22000000000',
  '00110000000',
  '00110000000',
  '00110000000',
  '00111111100',
  '00111111110',
];
const BOOT_FRAME_B = [
  '00000000000',
  '00000000000',
  '22000000000',
  '22110000000',
  '02110000000',
  '00110000000',
  '00111111100',
  '00111111110',
];

function WingedBoot(): React.JSX.Element {
  const [flap, setFlap] = useState(false);
  useEffect(() => {
    const iv = setInterval(() => setFlap((f) => !f), 340);
    return () => clearInterval(iv);
  }, []);
  const frame = flap ? BOOT_FRAME_A : BOOT_FRAME_B;
  return (
    <View style={styles.bootSpinner}>
      <View>
        {frame.map((row, y) => (
          <View key={y} style={styles.pixelRow}>
            {row.split('').map((cell, x) => (
              <View
                key={x}
                style={[
                  styles.pixel,
                  cell === '1' && styles.pixelBoot,
                  cell === '2' && styles.pixelWing,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.bootSpinnerLabel}>PROCESSING</Text>
    </View>
  );
}

/**
 * Sequence typer: reveals segments one by one, character by character.
 * Noise lines appear whole. Ellipsis-terminated lines blink before advancing.
 */
function useSequence(segs: Seg[], active: boolean, onDone: () => void) {
  const [idx, setIdx] = useState(0);
  const [chars, setChars] = useState(0);
  const [blinkLeft, setBlinkLeft] = useState(-1); // -1 = not blinking yet
  const [ellipsisOn, setEllipsisOn] = useState(true);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!active || doneRef.current) return;
    if (idx >= segs.length) {
      doneRef.current = true;
      onDone();
      return;
    }
    const seg = segs[idx];
    const typeMs =
      seg.who === 'noise' ? NOISE_MS : seg.who === 'hii' ? TYPE_MS_HII : TYPE_MS_COMPANION;

    if (seg.who === 'noise' ? false : chars < seg.text.length) {
      const t = setTimeout(() => setChars((c) => c + 1), typeMs);
      return () => clearTimeout(t);
    }
    // Line fully shown. Blink its trailing ellipsis, if any.
    if (seg.text.endsWith('...') && blinkLeft !== 0) {
      const left = blinkLeft === -1 ? BLINK_TOGGLES : blinkLeft;
      const t = setTimeout(() => {
        setEllipsisOn((v) => !v);
        setBlinkLeft(left - 1);
      }, BLINK_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => {
        setIdx((i) => i + 1);
        setChars(0);
        setBlinkLeft(-1);
        setEllipsisOn(true);
      },
      seg.who === 'noise' ? NOISE_MS : LINE_PAUSE_MS
    );
    return () => clearTimeout(t);
  }, [active, idx, chars, blinkLeft, segs, onDone]);

  const skip = () => {
    if (idx < segs.length) {
      setChars(segs[idx].text.length);
      setBlinkLeft(0);
    }
  };

  const rendered = segs.slice(0, Math.min(idx + 1, segs.length)).map((seg, i) => {
    if (i < idx) return { seg, text: seg.text };
    let text = seg.who === 'noise' ? seg.text : seg.text.slice(0, chars);
    if (i === idx && seg.text.endsWith('...') && chars >= seg.text.length && !ellipsisOn) {
      text = text.slice(0, -3) + '   ';
    }
    return { seg, text };
  });

  return { rendered, skip, typingDone: idx >= segs.length };
}

type Phase = 'boot' | 'cleared' | 'anomaly' | 'designation';

type Props = { onDone: (bootAnswer: string, designation: string) => void };

export function IntroOverlay({ onDone }: Props): React.JSX.Element {
  const [phase, setPhase] = useState<Phase>('boot');
  const [draft, setDraft] = useState('');
  const [bootAnswer, setBootAnswer] = useState('');
  const [anomalyDone, setAnomalyDone] = useState(false);
  const [designationDone, setDesignationDone] = useState(false);
  const bootSegs = useRef(withNoise(BOOT_SEQ)).current;
  const scrollRef = useRef<ScrollView>(null);

  const boot = useSequence(bootSegs, phase === 'boot', () => {
    setTimeout(() => setPhase('cleared'), 1400);
  });
  const anomaly = useSequence(ANOMALY_SEGS, phase === 'anomaly', () => setAnomalyDone(true));
  const designation = useSequence(DESIGNATION_SEGS, phase === 'designation', () =>
    setDesignationDone(true)
  );

  useEffect(() => {
    if (phase !== 'cleared') return;
    const t = setTimeout(() => {
      setPhase('anomaly');
      audio.voice('curious');
    }, 1100);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  });

  const transmit = () => {
    const text = draft.trim();
    if (!text) return;
    if (phase === 'anomaly') {
      setBootAnswer(text);
      setDraft('');
      setPhase('designation');
      audio.voice('curious');
    } else {
      onDone(bootAnswer, text);
    }
  };

  const activeSeq = phase === 'boot' ? boot : phase === 'anomaly' ? anomaly : designation;
  const showInput =
    (phase === 'anomaly' && anomalyDone) || (phase === 'designation' && designationDone);

  return (
    <Pressable style={styles.overlay} onPress={() => activeSeq.skip()}>
      <View style={styles.inner}>
        <Text style={styles.wordmark}>
          CHRONOS<Text style={{ color: colors.neon }}>-</Text>LENS
        </Text>

        <ScrollView ref={scrollRef} style={styles.exchange} contentContainerStyle={styles.exchangeInner}>
          {phase === 'boot' &&
            boot.rendered.map(({ seg, text }, i) =>
              seg.who === 'noise' ? (
                <Text key={i} style={styles.noiseLine}>
                  {text}
                </Text>
              ) : seg.who === 'hii' ? (
                <Text key={i} style={styles.hiiLine}>
                  ▚ {text}
                </Text>
              ) : (
                <View key={i} style={styles.aiBlock}>
                  <Text style={styles.aiLabel}>LENS</Text>
                  <Text style={styles.aiText}>{text}</Text>
                </View>
              )
            )}

          {(phase === 'anomaly' || phase === 'designation') && (
            <>
              {anomaly.rendered.map(({ text }, i) =>
                text.length > 0 || i === 0 ? (
                  <Text key={`a${i}`} style={styles.contactLine}>
                    {text}
                  </Text>
                ) : null
              )}
              {phase === 'designation' && (
                <>
                  <View style={styles.playerBlock}>
                    <Text style={styles.playerText}>{bootAnswer}</Text>
                  </View>
                  {designation.rendered.map(({ text }, i) => (
                    <Text key={`d${i}`} style={styles.contactLine}>
                      {text}
                    </Text>
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>

        {phase === 'boot' && <WingedBoot />}

        {showInput && (
          <>
            {phase === 'designation' && <Text style={styles.inputLabel}>ENTER USERNAME:</Text>}
            <TextInput
              style={styles.answerInput}
              value={draft}
              onChangeText={setDraft}
              placeholder="enter your response"
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
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 30,
    letterSpacing: 3,
    color: colors.bright,
    marginBottom: 18,
  },
  exchange: {
    flexGrow: 0,
    maxHeight: 420,
  },
  exchangeInner: {
    gap: 7,
  },
  hiiLine: {
    fontFamily: fonts.display,
    fontSize: 15,
    letterSpacing: 1.5,
    color: colors.bright,
  },
  noiseLine: {
    fontFamily: fonts.body,
    fontSize: 8.5,
    letterSpacing: 1,
    color: colors.phosphorFaint,
  },
  // Contact-phase companion lines: bare typed lines, transmission-like.
  contactLine: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.companionAmber,
    minHeight: 20,
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
  playerBlock: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
    borderRightWidth: 2,
    borderRightColor: colors.neon,
    backgroundColor: 'rgba(113,232,201,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  playerText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.bright,
    textAlign: 'right',
  },
  bootSpinner: {
    marginTop: 20,
    alignItems: 'center',
    gap: 8,
  },
  pixelRow: {
    flexDirection: 'row',
  },
  pixel: {
    width: 4,
    height: 4,
  },
  pixelBoot: {
    backgroundColor: colors.phosphor,
  },
  pixelWing: {
    backgroundColor: colors.bright,
  },
  bootSpinnerLabel: {
    fontFamily: fonts.body,
    fontSize: 8,
    letterSpacing: 3,
    color: colors.phosphorFaint,
  },
  inputLabel: {
    marginTop: 10,
    fontFamily: fonts.display,
    fontSize: 14,
    letterSpacing: 2,
    color: colors.bright,
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
