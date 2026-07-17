import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { audio } from '../audio/engine';
import { ScanlineOverlay } from '../components/ScanlineOverlay';
import { FeedbackModal } from '../components/FeedbackModal';
import { LogStrip } from '../components/LogStrip';
import { FieldScreen } from '../screens/FieldScreen';
import { IntroOverlay } from '../screens/IntroOverlay';
import { LensScreen } from '../screens/LensScreen';
import { ReliquaryScreen } from '../screens/ReliquaryScreen';
import { CALIB_DIRECTIVES, CALIB_DONE, useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';

type Tab = 'field' | 'lens' | 'reliquary';

const TABS: { key: Tab; label: string }[] = [
  { key: 'field', label: 'FIELD' },
  { key: 'lens', label: 'L.E.N.S.' },
  { key: 'reliquary', label: 'RELIQUARY' },
];

/** Bring-up telemetry, one line per module coming online (director's boot design). */
const MODULE_BOOT_LINES = [
  'MAP MODULE ONLINE · FIELD RECOVERY ACTIVE',
  'L.E.N.S. ONLINE · LOCALIZED EPOCH NORMALIZATION SCANNER',
  'RELIQUARY ONLINE · TYPE ARCHIVE READY',
];
const MODULE_BOOT_INTERVAL_MS = 1100;

/**
 * The naming retune: a brief non-blocking flicker the moment the name lands
 * (director's hybrid ruling — a felt shift, never a cutscene frame). Play
 * continues underneath; it dismisses itself.
 */
function NamingRetune({ onDone }: { onDone: () => void }): React.JSX.Element {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    let toggles = 0;
    const iv = setInterval(() => {
      toggles += 1;
      setVisible((v) => !v);
      if (toggles >= 7) {
        clearInterval(iv);
        onDone();
      }
    }, 180);
    return () => clearInterval(iv);
  }, [onDone]);
  return visible ? <View pointerEvents="none" style={styles.retune} /> : <></>;
}

export function AppShell(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('field');
  const [mutedUi, setMutedUi] = useState(audio.isMuted());
  const [resetArmed, setResetArmed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const resetSurvey = useGameStore((s) => s.resetSurvey);
  const introSeen = useGameStore((s) => s.introSeen);
  const markIntroSeen = useGameStore((s) => s.markIntroSeen);
  const appendLog = useGameStore((s) => s.appendLog);
  const namingFlash = useGameStore((s) => s.namingFlash);
  const clearNamingFlash = useGameStore((s) => s.clearNamingFlash);
  const brainMode = useGameStore((s) => s.brainMode);
  const switchBrain = useGameStore((s) => s.switchBrain);
  const calibStep = useGameStore((s) => s.calibStep);
  const beginCalibration = useGameStore((s) => s.beginCalibration);
  const modulesBooting = useGameStore((s) => s.modulesBooting);
  const finishModuleBoot = useGameStore((s) => s.finishModuleBoot);
  const [modulesOnline, setModulesOnline] = useState(3);
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    // While typing, the module viewport folds away so the conversation and
    // input own the space above the keyboard (chat mode).
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardUp(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  const directive =
    !modulesBooting && calibStep > 0 && calibStep < CALIB_DONE ? CALIB_DIRECTIVES[calibStep] : null;

  useEffect(() => {
    if (!modulesBooting) return;
    // System startup: MAP, L.E.N.S., RELIQUARY appear one by one.
    setModulesOnline(0);
    let count = 0;
    const iv = setInterval(() => {
      count += 1;
      setModulesOnline(count);
      useGameStore.getState().appendLog('sys', MODULE_BOOT_LINES[count - 1]);
      audio.play('sync');
      if (count >= MODULE_BOOT_LINES.length) {
        clearInterval(iv);
        setTimeout(() => finishModuleBoot(), 900);
      }
    }, MODULE_BOOT_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [modulesBooting, finishModuleBoot]);

  const visibleTabs = modulesBooting ? TABS.slice(0, modulesOnline) : TABS;

  // INV-8: no LVL/XP numbers, no progress or attunement bars, anywhere.
  // The companion's changing voice is the only visible maturation.
  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>
            CHRONOS<Text style={{ color: colors.neon }}>-</Text>LENS
          </Text>
          <View style={styles.hud}>
            <Pressable style={styles.muteBtn} hitSlop={8} onPress={() => setFeedbackOpen(true)}>
              <Text style={styles.hudText}>⚑</Text>
            </Pressable>
            <Pressable
              style={[styles.muteBtn, resetArmed && styles.resetArmed]}
              hitSlop={8}
              onPress={() => {
                if (!resetArmed) {
                  setResetArmed(true);
                  // Disarm if the second tap doesn't come quickly.
                  setTimeout(() => setResetArmed(false), 4000);
                } else {
                  setResetArmed(false);
                  void resetSurvey();
                  setTab('field');
                }
              }}
            >
              <Text style={[styles.hudText, resetArmed && styles.resetArmedText]}>
                {resetArmed ? 'ERASE ALL?' : '⟲'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.muteBtn}
              hitSlop={8}
              onPress={() => void switchBrain(brainMode === 'authored' ? 'llm' : 'authored')}
            >
              <Text style={styles.hudText}>{brainMode === 'llm' ? 'CORE·L' : 'CORE·A'}</Text>
            </Pressable>
            <Pressable
              style={styles.muteBtn}
              hitSlop={8}
              onPress={() => {
                audio.kick();
                const nowMuted = audio.toggleMute();
                setMutedUi(nowMuted);
                if (!nowMuted) audio.play('file'); // audible confirmation the channel works
                appendLog('sys', nowMuted ? 'AUDIO CHANNEL MUTED' : 'AUDIO CHANNEL OPEN');
              }}
            >
              <Text style={[styles.hudText, mutedUi && styles.muteOff]}>{mutedUi ? '♪ OFF' : '♪'}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        {visibleTabs.map((t) => (
          <Pressable
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => {
              audio.kick(); // bed fades in after first interaction, brief §7
              setTab(t.key);
            }}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {directive && (
        <View style={styles.directiveBar}>
          <Text style={styles.directiveText}>DIRECTIVE ▸ {directive}</Text>
        </View>
      )}

      <View style={[styles.body, keyboardUp && styles.bodyCollapsed]}>
        {modulesBooting && modulesOnline === 0 ? (
          <View style={styles.bootingBody}>
            <Text style={styles.bootingText}>ASSIGNING NEW ARCHIVE …</Text>
          </View>
        ) : (
          <>
            {tab === 'field' && <FieldScreen />}
            {tab === 'lens' && <LensScreen />}
            {tab === 'reliquary' && <ReliquaryScreen />}
          </>
        )}
      </View>

      <LogStrip />

      {!introSeen && (
        <IntroOverlay
          onDone={(bootAnswer, designation) => {
            audio.kick();
            markIntroSeen();
            void beginCalibration(bootAnswer, designation);
          }}
        />
      )}
      {namingFlash && <NamingRetune onDone={clearNamingFlash} />}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
      <ScanlineOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 5,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  wordmark: {
    fontFamily: fonts.display,
    fontSize: 21,
    letterSpacing: 2,
    color: colors.bright,
  },
  hud: {
    flexDirection: 'row',
    gap: 10,
  },
  hudText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.phosphorDim,
  },
  hudValue: {
    color: colors.phosphor,
    fontFamily: fonts.bodyMedium,
  },
  muteBtn: {
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  muteOff: {
    color: colors.phosphorFaint,
  },
  resetArmed: {
    borderColor: colors.warn,
  },
  resetArmedText: {
    color: colors.warn,
  },
  directiveBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: 'rgba(224,168,92,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  directiveText: {
    fontFamily: fonts.body,
    fontSize: 9.5,
    letterSpacing: 1.5,
    color: colors.interestAmber,
  },
  retune: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(217,201,138,0.10)',
    zIndex: 30,
  },
  bootingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  bootingText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.phosphorDim,
  },
  bars: {
    flexDirection: 'row',
    gap: 10,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.panel,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.neon,
  },
  tabText: {
    fontFamily: fonts.body,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.phosphorDim,
  },
  tabTextActive: {
    color: colors.neon,
  },
  body: {
    // Square module viewport (director 2026-07-12): the map and Lens render
    // width×width; the communication channel below gets everything else.
    width: '100%',
    aspectRatio: 1,
  },
  bodyCollapsed: {
    // Chat mode: viewport folds away while the keyboard is up.
    aspectRatio: undefined,
    height: 0,
    overflow: 'hidden',
  },
});
