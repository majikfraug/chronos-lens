import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { audio } from '../audio/engine';
import { ScanlineOverlay } from '../components/ScanlineOverlay';
import { HudBar } from '../components/HudBar';
import { LogStrip } from '../components/LogStrip';
import { FieldScreen } from '../screens/FieldScreen';
import { AwakeningOverlay } from '../screens/AwakeningOverlay';
import { IntroOverlay } from '../screens/IntroOverlay';
import { LensScreen } from '../screens/LensScreen';
import { ReliquaryScreen } from '../screens/ReliquaryScreen';
import { CALIB_DIRECTIVES, CALIB_DONE, useGameStore } from '../state/gameStore';
import { colors } from '../theme/colors';
import { fonts } from '../theme/typography';
import { ATTUNEMENT_MAX, MAX_LEVEL, XP_THRESHOLDS, registerFor } from '../config/economy';

type Tab = 'field' | 'lens' | 'reliquary';

const TABS: { key: Tab; label: string }[] = [
  { key: 'field', label: 'FIELD' },
  { key: 'lens', label: 'LENS' },
  { key: 'reliquary', label: 'RELIQUARY' },
];

export function AppShell(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>('field');
  const [mutedUi, setMutedUi] = useState(audio.isMuted());
  const [resetArmed, setResetArmed] = useState(false);
  const resetSurvey = useGameStore((s) => s.resetSurvey);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const attunement = useGameStore((s) => s.attunement);
  const introSeen = useGameStore((s) => s.introSeen);
  const markIntroSeen = useGameStore((s) => s.markIntroSeen);
  const appendLog = useGameStore((s) => s.appendLog);
  const awakeningPending = useGameStore((s) => s.awakeningPending);
  const brainMode = useGameStore((s) => s.brainMode);
  const switchBrain = useGameStore((s) => s.switchBrain);
  const calibStep = useGameStore((s) => s.calibStep);
  const beginCalibration = useGameStore((s) => s.beginCalibration);
  const directive = calibStep > 0 && calibStep < CALIB_DONE ? CALIB_DIRECTIVES[calibStep] : null;
  const register = registerFor(level, attunement);
  const prevThreshold = level === 1 ? 0 : XP_THRESHOLDS[level - 2];
  const nextThreshold = level >= MAX_LEVEL ? null : XP_THRESHOLDS[level - 1];
  const xpFraction = nextThreshold ? (xp - prevThreshold) / (nextThreshold - prevThreshold) : 1;
  const xpRightLabel = nextThreshold ? `${xp}/${nextThreshold}` : 'MAX';

  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <Text style={styles.wordmark}>
            CHRONOS<Text style={{ color: colors.neon }}>-</Text>LENS
          </Text>
          <View style={styles.hud}>
            <Text style={styles.hudText}>
              LVL <Text style={styles.hudValue}>{level}</Text>
            </Text>
            <Text style={styles.hudText}>
              XP <Text style={styles.hudValue}>{xp}</Text>
            </Text>
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
        <View style={styles.bars}>
          <HudBar label="PROGRESS" rightLabel={xpRightLabel} fraction={xpFraction} fillColor={colors.phosphorDim} />
          <HudBar
            label="ATTUNEMENT"
            rightLabel={register}
            fraction={attunement / ATTUNEMENT_MAX}
            fillColor={colors.companionAmberDim}
          />
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((t) => (
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

      <View style={styles.body}>
        {tab === 'field' && <FieldScreen />}
        {tab === 'lens' && <LensScreen />}
        {tab === 'reliquary' && <ReliquaryScreen />}
      </View>

      <LogStrip />

      {!introSeen && (
        <IntroOverlay
          onDone={(bootAnswer) => {
            audio.kick();
            markIntroSeen();
            void beginCalibration(bootAnswer);
          }}
        />
      )}
      {introSeen && awakeningPending && <AwakeningOverlay />}
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
    flex: 1,
    minHeight: 0,
  },
});
